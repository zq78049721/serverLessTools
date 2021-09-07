const defaultPager = {
    pageSize: 9999,
    pageIndex: 0
}

export default {
    createQuery(pager = {}) {
        const { pageSize, pageIndex } = {
            ...defaultPager,
            ...pager
        }
        return {
            limit: pageSize,
            offset: pageSize * pageIndex,
        }
    },
    createResult(pager = {}, count) {
        const { pageSize, pageIndex } = {
            ...defaultPager,
            ...pager
        }

        return {
            pageSize,
            pageIndex,
            total: count
        }
    }
} 