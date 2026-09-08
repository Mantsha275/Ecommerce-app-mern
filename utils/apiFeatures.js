// Fields a client is allowed to filter/sort on. Anything else is ignored,
// which prevents arbitrary Mongo operator injection through query params.
const ALLOWED_FILTER_FIELDS = ["price", "ratings", "category", "stock"];
const ALLOWED_OPERATORS = ["gt", "gte", "lt", "lte"];
const MAX_LIMIT = 100;

// Escape regex special characters so a user can't turn the keyword search
// into an arbitrary/expensive regex (or a ReDoS vector).
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    search() {
        const keyword = this.queryStr.keyword
            ? {
                  name: {
                      $regex: escapeRegex(String(this.queryStr.keyword)),
                      $options: "i",
                  },
              }
            : {};

        this.query = this.query.find({ ...keyword });
        return this;
    }

    filter() {
        const safeFilter = {};

        for (const field of ALLOWED_FILTER_FIELDS) {
            const value = this.queryStr[field];
            if (value === undefined) continue;

            if (typeof value === "object" && value !== null) {
                // e.g. price[gte]=100&price[lte]=500
                const opClause = {};
                for (const op of Object.keys(value)) {
                    if (ALLOWED_OPERATORS.includes(op)) {
                        const num = Number(value[op]);
                        if (!Number.isNaN(num)) {
                            opClause[`$${op}`] = num;
                        }
                    }
                }
                if (Object.keys(opClause).length) {
                    safeFilter[field] = opClause;
                }
            } else if (field === "category") {
                safeFilter[field] = String(value);
            } else {
                const num = Number(value);
                if (!Number.isNaN(num)) {
                    safeFilter[field] = num;
                }
            }
        }

        this.query = this.query.find(safeFilter);
        return this;
    }

    sort() {
        // Only allow sorting on a small whitelist of fields, e.g. sort=price,-createdAt
        const allowedSortFields = ["price", "ratings", "createdAt"];
        if (this.queryStr.sort) {
            const sortFields = String(this.queryStr.sort)
                .split(",")
                .filter((f) => allowedSortFields.includes(f.replace("-", "")))
                .join(" ");
            if (sortFields) {
                this.query = this.query.sort(sortFields);
            }
        }
        return this;
    }

    pagination(resPerPage) {
        let currentPage = Number(this.queryStr.page) || 1;
        if (currentPage < 1) currentPage = 1;

        let limit = Number(this.queryStr.limit) || resPerPage;
        if (limit < 1) limit = resPerPage;
        if (limit > MAX_LIMIT) limit = MAX_LIMIT;

        const skip = limit * (currentPage - 1);

        this.query = this.query.limit(limit).skip(skip);
        return this;
    }
}

export default APIFeatures;
