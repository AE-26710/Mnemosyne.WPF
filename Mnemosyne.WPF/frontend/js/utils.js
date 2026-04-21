(function (global) {
    const utils = {};
    // 配置平台
    global.PLATFORM_OPTIONS = ['Steam', '崩坏：星穹铁道', '崩坏3', '战争雷霆'];
    // 元转换为整数分
    utils.yuanToCents = (value) => {
        const num = Number(value);
        if (!Number.isFinite(num)) return Number.NaN;
        return Math.round(num * 100);
    };

    // 整数分转换为元
    utils.centsToYuan = (value) => {
        const num = Number(value);
        if (!Number.isFinite(num)) return 0;
        return num / 100;
    };

    // 格式化金额，UI展示时使用
    utils.formatCurrency = (value) => {
        return utils.centsToYuan(value).toFixed(2);
    };

    // 格式化日期
    utils.formatDate = (dateStr) => {
        // 如果是空字符串或 null/undefined，直接返回 '-'
        if (!dateStr) return '-';
        // 如果已经是 'YYYY-MM-DD' 格式，直接返回
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        // 尝试转换为 Date 对象
        const date = new Date(dateStr);
        // 如果转换失败，抛出错误
        if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid Date: The provided string "${dateStr}" could not be parsed.`);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        // 返回 'YYYY-MM-DD' 格式的字符串
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
        return records.reduce((sum, item) => sum + Math.round(Number(item.amount) || 0), 0);
    };

    utils.filterByTag = (records, tagName) => {
        return records.filter((item) => {
            const tags = Array.isArray(item.tagsList) ? item.tagsList : [];
            return tags.includes(tagName);
        });
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