(function () {
    const { createApp, ref, onMounted } = Vue;

    createApp({
        components: {
            'date-filter': MnemosyneComponents.DateFilter
        },
        setup() {
            const currentYear = new Date().getFullYear();
            const availableYears = ref([currentYear]);
            const selectedYear = ref(currentYear);
            const fireflyExpenses = ref([]);

            const heatmapRef = ref(null);

            const normalizeDate = (expenseDate) => {
                if (!expenseDate) return '';
                return String(expenseDate).slice(0, 10);
            };

            const buildHeatmapDataByYear = (year) => {
                const prefix = `${year}-`;
                const aggregated = new Map();

                fireflyExpenses.value.forEach((entry) => {
                    const date = normalizeDate(entry.expenseDate);
                    if (!date.startsWith(prefix)) return;

                    const amount = Number(entry.amount) || 0;
                    aggregated.set(date, (aggregated.get(date) || 0) + amount);
                });

                return Array.from(aggregated.entries()).sort((a, b) => a[0].localeCompare(b[0]));
            };

            // 核心渲染逻辑
            const updateHeatMap = () => {
                try {
                    const data = buildHeatmapDataByYear(selectedYear.value);
                    
                    if (heatmapRef.value) {
                        MnemosyneCharts.renderFireflyHeatmap(heatmapRef.value, data, selectedYear.value);
                    }
                } catch (err) {
                    console.error("加载流萤热力图失败:", err);
                }
            };

            const loadAllFireflyExpenses = async () => {
                try {
                    const rawEntries = await api.getAllFireflyExpenses();
                    fireflyExpenses.value = Array.isArray(rawEntries) ? rawEntries : [];

                    const years = [...new Set(
                        fireflyExpenses.value
                            .map((entry) => normalizeDate(entry.expenseDate).slice(0, 4))
                            .filter((year) => /^\d{4}$/.test(year))
                            .map((year) => Number(year))
                    )].sort((a, b) => b - a);

                    if (years.length > 0) {
                        availableYears.value = years;
                        selectedYear.value = years[0];
                    }

                    updateHeatMap();
                } catch (err) {
                    console.error("加载流萤条目失败:", err);
                }
            };

            onMounted(() => {
                loadAllFireflyExpenses();
            });

            return {
                availableYears,
                selectedYear,
                heatmapRef, // 必须返回，Vue 才能绑定到 HTML
                fetchData: updateHeatMap // 供 HTML 里的 @change 调用
            };
        }
    }).mount('#app');
})();