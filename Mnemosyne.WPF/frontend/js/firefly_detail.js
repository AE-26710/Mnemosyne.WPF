(function () {
    const { createApp, ref, onMounted, computed } = Vue;
    const { formatCurrency } = MnemosyneUtils;
    createApp({
        components: {
            'date-filter': MnemosyneComponents.DateFilter
        },
        setup() {
            /** 当前年份。@type {number} */
            const currentYear = new Date().getFullYear();
            /** 可选年份列表。@type {import('vue').Ref<number[]>} */
            const availableYears = ref([currentYear]);
            /** 当前选中的年份。@type {import('vue').Ref<number>} */
            const selectedYear = ref(currentYear);
            /** 当前选中的日期（YYYY-MM-DD）。@type {import('vue').Ref<string|null>} */
            const selectedDate = ref(null);

            /** 按年份分组的热力图数据。@type {import('vue').Ref<Record<string, Array>>} */
            const heatmapByYear = ref({});
            /** 按日期分组的明细数据。@type {import('vue').Ref<Record<string, Array>>} */
            const detailsByDate = ref("");
            /** 月度占比数据。@type {import('vue').Ref<Array>} */
            const monthlyShare = ref([]);

            /** 热力图容器引用。@type {import('vue').Ref<HTMLElement|null>} */
            const heatmapRef = ref(null);
            /** 月度占比图容器引用。@type {import('vue').Ref<HTMLElement|null>} */
            const shareBarRef = ref(null);

            /**
             * 当前选中日期的消费明细。
             * @type {import('vue').ComputedRef<Array>}
             */
            const dailyDetails = computed(() => {
                if (!selectedDate.value) return [];
                return detailsByDate.value[selectedDate.value] || [];
            });

            /**
             * 处理热力图日期点击事件。
             * @param {string} date 被点击的日期（YYYY-MM-DD）。
             */
            const handleDateClick = (date) => {
                selectedDate.value = date;
            };

            /** 刷新热力图并绑定点击事件。 */
            const updateHeatMap = () => {
                try {
                    const data = heatmapByYear.value[selectedYear.value] || [];
                    selectedDate.value = null;

                    if (heatmapRef.value) {
                        const chart = MnemosyneCharts.renderFireflyHeatmap(heatmapRef.value, data, selectedYear.value);
                        chart.on('click', (params) => {
                            if (params.data) {
                                handleDateClick(params.data[0]);
                            }
                        });
                    }
                } catch (err) {
                    console.error('加载流萤热力图失败:', err);
                }
            };

            /** 刷新月度消费占比堆叠柱状图。 */
            const updateShareChart = () => {
                try {
                    if (!shareBarRef.value) return;
                    MnemosyneCharts.renderFireflySharePercentStackedBar(shareBarRef.value, monthlyShare.value, 48);
                } catch (err) {
                    console.error('加载流萤月度占比图失败:', err);
                }
            };

            /**
             * 加载流萤页概览数据并刷新图表。
             * @returns {Promise<void>}
             */
            const loadFireflyOverview = async () => {
                try {
                    const overview = await api.getFireflyOverview();

                    heatmapByYear.value = overview.heatmapByYear || {};
                    detailsByDate.value = overview.detailsByDate || {};
                    monthlyShare.value = Array.isArray(overview.monthlyShare) ? overview.monthlyShare : [];

                    const years = Array.isArray(overview.years) ? overview.years : [];
                    if (years.length > 0) {
                        availableYears.value = years;
                        selectedYear.value = years[0];
                    }

                    updateHeatMap();
                    updateShareChart();
                } catch (err) {
                    console.error('加载流萤概览失败:', err);
                }
            };

            onMounted(() => {
                loadFireflyOverview();
            });

            return {
                formatCurrency,
                availableYears,
                selectedYear,
                selectedDate,
                dailyDetails,
                heatmapRef,
                shareBarRef,
                fetchData: updateHeatMap
            };
        }
    }).mount('#app');
})();