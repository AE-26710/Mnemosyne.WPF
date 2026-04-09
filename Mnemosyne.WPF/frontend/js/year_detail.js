(function () {
    const { createApp, ref, onMounted } = Vue;

    createApp({
        components: {
            'date-filter': MnemosyneComponents.DateFilter
        },
        setup() {
            const currentYear = new Date().getFullYear();
            const startYear = 2022;
            const availableYears = ref(Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i));
            const selectedYear = ref(currentYear);

            const heatmapRef = ref(null);

            // 核心渲染逻辑
            const updateHeatMap = async () => {
                try {
                    // 调用 api.js 获取数据
                    const data = await api.getAnnualHeatmap(selectedYear.value);
                    
                    // 调用 charts.js 里的渲染函数
                    if (heatmapRef.value) {
                        MnemosyneCharts.renderAnnualHeatmap(heatmapRef.value, data, selectedYear.value);
                    }
                } catch (err) {
                    console.error("加载年度热力图失败:", err);
                }
            };

            onMounted(() => {
                updateHeatMap();
            });

            return {
                availableYears,
                selectedYear,
                heatmapRef,
                fetchData: updateHeatMap
            };
        }
    }).mount('#app');
})();