(function () {
    const { createApp, ref, onMounted } = Vue;
    // 从刚才提取的 utils 中解构需要的工具函数
    // 类似于C++的 using MnemosyneUtils::formatCurrency;
    // 这样就可以直接使用 formatCurrency() 而不是 MnemosyneUtils.formatCurrency()
    const { formatCurrency, getRateClass, toPieData } = MnemosyneUtils;

    createApp({
        setup() {
            const kpi = ref({
                historicalTotal: 0,
                thisMonthTotal: 0,
                thisYearTotal: 0,
                momRate: 0,
                yoyRate: 0,
                yearYoyRate: 0,
                lastMonthTotal: 0,
                lastYearTotal: 0,
                fireflyTotal: 0,
                fireflyPercent: 0,
            });

            /**
             * 拉取并刷新仪表盘 KPI 数据。
             * @returns {Promise<void>}
             */
            const fetchKPI = async () => {
                try {
                    kpi.value = await api.getKPI();
                } catch (error) {
                    console.error('Failed to fetch KPI:', error);
                }
            };

            /**
             * 初始化平台分布饼图。
             * @returns {Promise<void>}
             */
            const initPieChart = async () => {
                try {
                    const json = await api.getPlatforms();
                    const pieData = toPieData(json.data);

                    const el = document.getElementById('pieChart');
                    if (!el) return;
                    MnemosyneCharts.renderPlatformPie(el, pieData);
                } catch (error) {
                    console.error('Failed to initialize pie chart:', error);
                }
            };

            /**
             * 初始化月度堆叠柱状图。
             * @returns {Promise<void>}
             */
            const initBarChart = async () => {
                try {
                    const json = await api.getMonthlyStacked();
                    const rawData = json.data;
                    const el = document.getElementById('barChart');
                    if (!el) return;

                    MnemosyneCharts.renderMonthlyStackedBar(el, rawData);
                } catch (error) {
                    console.error('Failed to initialize bar chart:', error);
                }
            };

            const secretSequence = 'RmlyZWZseQ==';
            let currentSequence = '';
            const showSqlModal = ref(false);
            const sqlQuery = ref('SELECT * FROM expenses ORDER BY id DESC LIMIT 5;');
            const sqlResult = ref(null);
            const sqlColumns = ref([]);
            const sqlError = ref('');
            const sqlSuccessMessage = ref('');

            /**
             * 监听全局按键，匹配密钥后打开 SQL 彩蛋弹窗。
             * @param {KeyboardEvent} e 键盘事件。
             * @returns {void}
             */
            const handleGlobalKeydown = (e) => {
                if (e.key.length === 1 || e.key === '=') {
                    currentSequence += e.key;
                    if (currentSequence.length > secretSequence.length) {
                        currentSequence = currentSequence.substring(currentSequence.length - secretSequence.length);
                    }
                    if (currentSequence === secretSequence) {
                        showSqlModal.value = true;
                        sqlResult.value = null;
                        sqlError.value = '';
                        sqlSuccessMessage.value = '';
                        currentSequence = '';
                    }
                }
            };

            /**
             * 关闭 SQL 弹窗。
             * @returns {void}
             */
            const closeSqlModal = () => {
                showSqlModal.value = false;
            };

            /**
             * 执行 SQL 语句并更新结果展示区域。
             * @returns {Promise<void>}
             */
            const executeSql = async () => {
                sqlError.value = '';
                sqlSuccessMessage.value = '';
                sqlResult.value = null;
                sqlColumns.value = [];

                if (!sqlQuery.value.trim()) return;

                try {
                    const res = await api.runSQL(sqlQuery.value);
                    if (res.status === 'success') {
                        if (res.data) {
                            sqlResult.value = res.data;
                            sqlColumns.value = res.columns || [];
                        } else {
                            sqlSuccessMessage.value = res.message;
                            refreshAllData();
                        }
                    } else {
                        sqlError.value = res.message || 'Unknown error occurred';
                    }
                } catch (e) {
                    sqlError.value = e.message;
                }
            };

            /**
             * 跳转到transactions页面
             * @returns {void}
             */
            const goToTransactions = () => {
                window.location.href = 'transactions.html';
            };

            /**
             * 跳转到当前月份的明细页。
             * @returns {void}
             */
            const goToCurrentMonthDetail = () => {
                const monthStr = kpi.value.serverTime?.displayMonth;
                if (monthStr) {
                    window.location.href = `month_detail.html?month=${monthStr}`;
                }
            };

            /**
             * 跳转到当前年份的明细页。
             * @returns {void}
             */
            const goToCurrentYearDetail = () => {
                const yearStr = kpi.value.serverTime?.displayYear;
                if (yearStr) {
                    window.location.href = `year_detail.html?year=${yearStr}`;
                }
            };

            /**
             * 跳转到流萤明细页。
             * @returns {void}
             */
            const goToFireflyDetail = () => {
                window.location.href = 'firefly_detail.html';
            };

            /**
             * 刷新仪表盘全部数据，包括 KPI 和图表。
             * @returns {void}
             */
            const refreshAllData = () => {
                fetchKPI();
                initPieChart();
                initBarChart();
            };

            onMounted(() => {
                fetchKPI();
                initPieChart();
                initBarChart();
                window.addEventListener('keydown', handleGlobalKeydown);
            });

            return {
                kpi,
                getRateClass,
                formatCurrency,
                refreshAllData,
                showSqlModal,
                sqlQuery,
                sqlResult,
                sqlColumns,
                sqlError,
                sqlSuccessMessage,
                closeSqlModal,
                executeSql,
                goToTransactions,
                goToCurrentMonthDetail,
                goToCurrentYearDetail,
                goToFireflyDetail
            };
        },
    }).mount('#app');
})();
