(function (global) {
    const utils = {};

    // 格式化金额
    utils.formatCurrency = (value) => {
        const num = Number(value);
        return Number.isFinite(num) ? num.toFixed(2) : '0.00';
    };

    // 格式化日期
    utils.formatDate = (dateStr) => {
        if (!dateStr) return '-';
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return dateStr;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    utils.getRateClass = (value) => {
        if (value > 0) return 'rate-up';
        if (value < 0) return 'rate-down';
        return 'rate-neutral';
    };

    utils.calcGrowthRate = (current, previous) => {
        const c = Number(current) || 0;
        const p = Number(previous) || 0;
        if (p <= 0) return c > 0 ? 100 : 0;
        return ((c - p) / p) * 100;
    };

    utils.getPreviousMonth = (monthStr) => {
        if (!/^\d{4}-\d{2}$/.test(monthStr)) return '';
        const [yearStr, monthPart] = monthStr.split('-');
        const y = Number(yearStr);
        const m = Number(monthPart);
        const d = new Date(y, m - 2, 1);
        const yy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${yy}-${mm}`;
    };

    utils.getSameMonthLastYear = (monthStr) => {
        if (!/^\d{4}-\d{2}$/.test(monthStr)) return '';
        const [yearStr, monthPart] = monthStr.split('-');
        const y = Number(yearStr) - 1;
        const m = Number(monthPart);
        if (!Number.isFinite(y) || !Number.isFinite(m)) return '';
        return `${y}-${String(m).padStart(2, '0')}`;
    };

    utils.getDaysInMonth = (monthStr) => {
        if (!/^\d{4}-\d{2}$/.test(monthStr)) return 30;
        const [y, m] = monthStr.split('-').map(Number);
        return new Date(y, m, 0).getDate();
    };

    utils.sumAmounts = (records) => {
        if (!Array.isArray(records)) return 0;
        return records.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    };

    utils.filterByTag = (records, tagName) => {
        return records.filter((item) => {
            const tags = Array.isArray(item.tagsList) ? item.tagsList : [];
            return tags.includes(tagName);
        });
    };

    utils.buildDailyHeatmapData = (recordsData) => {
        const dailySum = {};
        let maxAmount = 0;
        recordsData.forEach((item) => {
            const date = utils.formatDate(item.expenseDate);
            const amount = Number(item.amount) || 0;
            dailySum[date] = (dailySum[date] || 0) + amount;
        });
        const heatmapData = [];
        for (const [date, amount] of Object.entries(dailySum)) {
            heatmapData.push([date, amount]);
            if (amount > maxAmount) maxAmount = amount;
        }
        return { heatmapData, maxAmount };
    };

    utils.toPieData = (rows) => {
        if (!Array.isArray(rows)) return [];
        return rows.map((item) => ({
            name: item.platform,
            value: item.totalAmount,
        }));
    };

    global.MnemosyneUtils = utils;
})(window);