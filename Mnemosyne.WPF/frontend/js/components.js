(function (global) {
    /**
     * 通用日期选择组件
     * props:
     * - years: 可选年份数组
     * - year: 当前选中的年份 (v-model:year)
     * - month: 当前选中的月份 (v-model:month)
     * - showMonth: 是否启用月份选择块 (Boolean)
     */
    global.MnemosyneComponents = {
        DateFilter: {
            props: {
                years: { type: Array, required: true },
                year: { type: [Number, String], required: true },
                month: { type: [Number, String], default: '' },
                showMonth: { type: Boolean, default: false }
            },
            emits: ['update:year', 'update:month', 'change'],
            mounted() {
                // showMonth 是静态（不会改变）
                // 如果启用月份选择（showMonth === true），确保没有选择 "全年"（''），默认为 1 月
                if (this.showMonth) {
                    if (this.month === '' || this.month === null || this.month === undefined) {
                        this.$emit('update:month', 1);
                        this.$emit('change');
                    }
                } else {
                    // 如果不启用月份选择，确保 month 显示为 '全年'（空字符串）
                    if (this.month !== '') {
                        this.$emit('update:month', '');
                        this.$emit('change');
                    }
                }
            },
            template: `
                <div class="filter-section" style="margin: 20px 0; background: var(--color-surface); padding: 15px; border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                    <label style="font-weight: 500;">选择年份:</label>
                    <select :value="year" 
                            @change="$emit('update:year', Number($event.target.value)); $emit('change')" 
                            class="custom-select">
                        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                    </select>

                    <label style="font-weight: 500; margin-left: 10px;">选择月份:</label>
                    <select :value="month"
                            :disabled="!showMonth"
                            @change="$emit('update:month', $event.target.value === '' ? '' : Number($event.target.value)); $emit('change')"
                            class="custom-select">
                        <option v-if="!showMonth" value="">全年</option>
                        <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                    </select>
                </div>
            `
        },
        /**
         * 审计局：5分打孔卡片量表
         * 用法: <audit-scale-five v-model="formData.q1" name="q1" label-left="生存需求" label-right="景观展示" />
         */
        AuditScaleFive: {
            props: {
                modelValue: { type: Number, default: 0 }, // 绑定的值 (1-5)
                name: { type: String, required: true },   // input的name属性，保证单选组的唯一性
                labelLeft: { type: String, required: true }, // 左侧说明文字
                labelRight: { type: String, required: true } // 右侧说明文字
            },
            emits: ['update:modelValue'],
            template: `
                <div class="scale-container">
                    <div class="scale-group">
                        <label v-for="n in 5" :key="n" class="scale-option">
                            <input 
                                type="radio" 
                                :name="name" 
                                :value="n" 
                                :checked="modelValue === n"
                                @change="$emit('update:modelValue', n)"
                            >
                            <span>{{ n }}</span>
                        </label>
                    </div>
                    <div class="scale-labels">
                        <span>{{ labelLeft }}</span>
                        <span>{{ labelRight }}</span>
                    </div>
                </div>
            `
        },

        /**
         * 审计局：是/否 二元机械开关
         * 用法: <audit-scale-binary v-model="formData.q3" name="q3" true-label="是/YES" false-label="否/NO" :true-value="true" :false-value="false" />
         */
        AuditScaleBinary: {
            props: {
                modelValue: { required: true }, // 当前绑定的值
                name: { type: String, required: true },
                trueLabel: { type: String, default: '是 / YES' },
                falseLabel: { type: String, default: '否 / NO' },
                // 允许自定义选中时赋给 v-model 的值，默认为布尔值，也可以是字符串 'yes'/'no'
                trueValue: { default: true },
                falseValue: { default: false }
            },
            emits: ['update:modelValue'],
            template: `
                <div class="binary-group">
                    <label class="binary-option">
                        <input 
                            type="radio" 
                            :name="name" 
                            :value="falseValue" 
                            :checked="modelValue === falseValue"
                            @change="$emit('update:modelValue', falseValue)"
                        >
                        <span class="binary-btn">{{ falseLabel }}</span>
                    </label>
                    <label class="binary-option">
                        <input
                            type="radio"
                            :name="name"
                            :value="trueValue"
                            :checked="modelValue === trueValue"
                            @change="$emit('update:modelValue', trueValue)"
                        >
                        <span class="binary-btn">{{ trueLabel }}</span>
                    </label>
                </div>
            `
        }
    };

})(window);