(function () {
    const { createApp, ref, onMounted } = Vue;

    createApp({
        setup() {
            const currentYear = new Date().getFullYear();
            const startYear = 2024;
            const availableYears = ref(Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i));
            const selectedYear = ref(currentYear);

            const heatmapRef = ref(null);

            // 核心渲染逻辑
            const updateHeatMap = async () => {
                try {
                    // 调用 api.js 获取数据
                    const data = await api.getFireflyHeatmap(selectedYear.value);
                    
                    // 调用 charts.js 里的渲染函数
                    if (heatmapRef.value) {
                        MnemosyneCharts.renderFireflyHeatmap(heatmapRef.value, data, selectedYear.value);
                    }
                } catch (err) {
                    console.error("加载流萤热力图失败:", err);
                }
            };

            onMounted(() => {
                updateHeatMap();
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