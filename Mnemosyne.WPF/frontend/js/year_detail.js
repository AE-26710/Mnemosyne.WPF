(function () {
    const { createApp, ref, onMounted } = Vue;

    createApp({
        components: {
            'date-filter': MnemosyneComponents.DateFilter
        },
        setup() {
            /** 当前年份。@type {number} */
            const currentYear = new Date().getFullYear();
            /** 起始年份。@type {number} */
            const startYear = 2022;
            /** 可选年份列表。@type {import('vue').Ref<number[]>} */
            const availableYears = ref(Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i));
            /** 当前选中的年份。@type {import('vue').Ref<number>} */
            const selectedYear = ref(currentYear);
            /** 热力图容器引用。@type {import('vue').Ref<HTMLElement|null>} */
            const heatmapRef = ref(null);
            /** 堆叠柱状图容器引用。@type {import('vue').Ref<HTMLElement|null>} */
            const stackBarRef = ref(null);
            /** 月度占比图容器引用。@type {import('vue').Ref<HTMLElement|null>} */
            const shareBarRef = ref(null);

            // 核心渲染逻辑
            const fetchData = async () => {
                try {
                    // 调用 api.js 获取统一数据
                    const data = await api.getYearDetail(selectedYear.value);
                    
                    // 调用 charts.js 里的渲染函数
                    if (heatmapRef.value) {
                        MnemosyneCharts.renderAnnualHeatmap(heatmapRef.value, data.heatmap, selectedYear.value);
                    }
                    if (stackBarRef.value) {
                        MnemosyneCharts.renderAnnualPlatformPercentStackedBar(stackBarRef.value, data.monthlyPlatform);
                    }
                    if (shareBarRef.value) {
                        MnemosyneCharts.renderPlatformPie(shareBarRef.value, data.platformShare);
                    }
                } catch (err) {
                    console.error("加载年度数据失败:", err);
                }
            };

            onMounted(() => {
                fetchData();
            });

            return {
                availableYears,
                selectedYear,
                heatmapRef,
                stackBarRef,
                shareBarRef,
                fetchData
            };
        }
    }).mount('#app');
})();