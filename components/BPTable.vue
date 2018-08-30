<!--
通用表单组件  兼容iview的用法，对部分bug进行修复

#引用方式：
import BPTable from '@/components/Common/BPTable.vue'
components: {BPTable}
<BPTable :data="bodyData" :columns="headData" fixed loadMore stripe border :total="footData"></BPTable>

#兼容优化
壳宽度计算border和滚动条宽度

    columns:[{              表头数据
        title:''                                                                表头名称
        key:''                                                                  列的键值
        align: ''                                                               对齐方式
        bodyAlign: ''                                                           body对齐方式 优先级高于align
        toolTip:[tip,pos]                                                       表头提示信息 tip提示内容，pos提示出现位置（同iview的tooltip）
        cellTip:pos                                                             内容提示信息 pos提示出现位置（同iview的tooltip）
        cellTitle                                                               内容提示信息，无入参

        link: (params) => { this.method(params))},                              参数为回调函数，params入参与调用名保持一致，
        noLink:[{s:1}]                                                          在有link的情况下，设置列外项
        buttons: [{title:'编辑',key:'edit', case:[{s:1}], caseType:'OR'}]        title展示，在link回调函数中返回key，用params.key匹配

        filterFunc:(params) => { this.filterFunc(params)}                       方法内必须return不然展示为空
        type: ''                                                                可选值：{index:索引,html:网页,select:选择框,normal:默认}   监听：@on-select    返回：当前选中的数组

        father:[{}]                                                             多级表头，具体用法看文档
        noTween: false                                                          是否补间，当表格拉伸时是否同比例放大
    }]

    cellTip,cellTitle,link三个同时存在一个

pages:{      翻页信息，
    current:0 当前页码
    size:0    每页显示数量|选填，默认10
    total:0   数据总条数
}

jetty 2018-05
-->
<template>
    <div class="bpTable" :style="getOuterStyle">
        <div class="table-content" ref="outer-box">
            <div class="table-box" ref="box" @scroll="scrollHandle" :style="getBoxStyle">
                <table cellpadding="0" cellspacing="0" :class="[this.stripe ? 'bpStripe' : '']" :style="getStyle">
                    <!-- 标题层 -->
                    <thead ref="bpHead">
                    <tr v-for="(dt2,index2) of headerData2" :key="index2">
                        <th v-for="(column,index) of dt2"
                            :key="index"
                            :class="[fixed > index ? 'fixed' : '', column.border ? 'fixed-b' : '']"
                            :height="headerHeight"
                            :rowspan="column.rowspan"
                            :colspan="column.colspan"
                            :width="column.width"
                        >
                            <div class="bpcell">
                                <span v-if="column.toolTip">
                                    <Cell :row="column" :render="createTip()"></Cell>
                                </span>
                                <span v-else>
                                {{column.title}}
                                </span>
                            </div>
                        </th>
                    </tr>
                    <tr>
                        <th v-for="(column,index) of headerData"
                            :key="index"
                            :class="[fixed > index ? 'fixed' : '', (fixed == index + 1 || column.border) ? 'fixed-b' : '']"
                            :align="column.align"
                            :width="(column.border) ? (column._width - 1) : column._width"
                            :max-width="(column.border) ? (column._width - 1) : column._width"
                            :min-width="(column.border) ? (column._width - 1) : column._width"
                            :height="headerHeight"
                            v-if="!column.noneself"
                        >
                            <div class="bpcell">
                                <span v-if="column.toolTip">
                                    <Cell :row="column" :render="createTip()"></Cell>
                                </span>
                                <span v-else-if="column.type && column.type == 'select'">
                                    <Checkbox @click.native.stop="handleClick" @on-change="selectAll"></Checkbox>
                                </span>
                                <span v-else>
                                {{column.title}}
                                </span>
                            </div>
                        </th>
                    </tr>
                    </thead>
                    <!-- 数据层 -->
                    <tbody align="center">
                    <tr v-for="(row,rowIndex) of bodyData" :key="rowIndex">
                        <td v-for="(column,colIndex) in headerData"
                            :key="colIndex"
                            :class="[fixed > colIndex ? 'fixed' : '', fixed == colIndex + 1 ? 'fixed-b' : '',column.cellTip ? 'overflowword' : '']"
                            :align="column.bodyAlign"
                            :width="column._width"
                            :max-width="column._width"
                            :min-width="column._width"
                            :height="height"
                        >
                            <div class="bpcell" :style="{width:column.cellTip ? `${column._width}px` : 'auto'}">
                                <BPCell :rowIndex="rowIndex" :colIndex="colIndex" :row="row" :pages="bpPages"
                                        :column="column"></BPCell>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="bodyData.length == 0">
                        <td class="nodata" :style="{width:tableWidth + 'px'}" :colspan="headerData.length">
                            <span>无数据</span>
                        </td>
                    </tr>
                    </tbody>
                    <!-- 汇总层 -->
                    <tfoot v-if="JSON.stringify(footerData) !== '{}'" ref="bpFoot">
                    <tr>
                        <td v-for="(column,colIndex) of headerData"
                            :key="colIndex"
                            :class="[fixed > colIndex ? 'fixed' : '', fixed == colIndex + 1 ? 'fixed-b' : '']"
                            :align="column.align"
                            :width="column._width"
                            :max-width="column._width"
                            :min-width="column._width"
                            :height="footerHeight"
                        >
                            <div class="bpcell">
                                <BPCell v-if="column.link && !column.buttons && !column.noSummaryLink"
                                        :colIndex="colIndex" :row="footerData" :column="column"></BPCell>
                                <span class="bpcell" v-else>
                                    {{footerData['_' + column.key] | getNotNull}}
                            </span>
                            </div>
                        </td>
                    </tr>
                    </tfoot>
                </table>
            </div>
            <Spin fix size="large" v-if="loading">
                <slot name="loading"></slot>
            </Spin>
        </div>
        <div class="pages" v-if="JSON.stringify(bpPages) !== '{}'">
            <div class="pages-total">共{{bpPages.total}}条记录</div>
            <div class="pages-box">
                <Page :total="bpPages.total" :page-size="bpPages.size" :current="bpPages.current"
                      @on-change="changePage"></Page>
                <div class="page-jump">
                    <div class="jump-input"><Input type="text" v-model="topage" @on-enter="changePage(topage)"></Input>
                    </div>
                    <div class="jump-button" @click="changePage(topage)">跳转</div>
                    <div style="clear:both;"></div>
                </div>
                <div style="clear:both;"></div>
            </div>
        </div>
    </div>
</template>
<script>
    import BPCell from './BPTable/BPCell.vue'
    import Cell from './BPTable/expand.js'
    import {deepCopy, isNull, createTip, getDefaultWidth, getDefaultAlign} from './BPTable/BPTable.js'

    export default {
        name: 'BPTable',
        components: {
            BPCell,
            Cell
        },
        props: {
            columns: {  // 表头数据
                type: Array,
                default: () => {
                    return []
                }
            },
            data: {     // 表内数据
                type: Array,
                default: () => {
                    return []
                }
            },
            total: {    // 表尾数据
                type: Object,
                default: () => {
                    return {}
                }
            },
            pages: {
                type: Object,
                default: () => {
                    return {}
                }
            },
            stripe: {   // 斑马线
                type: Boolean,
                default: false
            },
            border: {   // 边线
                type: Boolean,
                default: false
            },
            loadMore: { // 是否开启下拉加载  监听：@load-more="callback()"
                type: [Boolean, Function],
                default: false
            },
            fixed: {    // 左边栏锁定几列，默认不锁定
                type: Number,
                default: 0
            },
            width: {    // 默认单元格宽度
                type: Number,
                default: 70
            },
            height: {   // 默认单元格高度
                type: Number,
                default: 50
            },
            headerHeight: {     // 表头最大高度
                type: Number,
                default: 50
            },
            footerHeight: {     // 表尾最大高度
                type: Number,
                default: 50
            },
            loading: {          // 加载中遮罩显示
                type: Boolean,
                default: false
            },
            maxWidth: {         // table壳的最大宽度 不传不限制
                type: Number,
                default: 0
            },
            maxHeight: {        // table壳的最大高度  不传不限制
                type: Number,
                default: 0
            }
        },

        data () {
            return {
                footerData: null,
                bodyData: [],
                headerData: null,
                headerData2: null,
                tableWidth: 0,
                mathWidth: 0,
                barWidth: 0, // 滚动条宽度
                bpPages: this.pages,
                topage: 1, // 跳转至分页
                rollleft: 0
            }
        },
        filters: {
            getNotNull (val) {
                if (isNull(val)) {
                    return ' '
                }
                return val
            }
        },
        mounted () {
            if (window.addEventListener) {
                window.addEventListener('resize', this.handleResize, false)
            } else {
                window.attachEvent('onresize', this.handleResize)
            }
            this.handleResize()
        },

        created () {
            this.headerData = this.reBuildHeader()
            this.bodyData = this.reBuildBody()
            this.footerData = this.reBuildFooter()
            this.barWidth = this.getBarWidth()
        },

        computed: {
            getBoxStyle () {
                let style = {}
                if (this.maxHeight != 0) {
                    style.maxHeight = `${this.maxHeight}px`
                }
                let trueWidth = this.tableWidth + this.barWidth + (this.border ? 2 : 0)
                if (this.maxWidth != 0 && this.maxWidth < this.tableWidth) { // 实际宽度大于最大宽度则收缩
                    trueWidth = this.maxWidth
                    style.width = style.maxWidth = `${trueWidth}px`
                } else {
                    style.width = 'auto'
                }
                if (this.border) {
                    style.border = `1px solid #e7e7e7`
                }
                return style
            },

            getOuterStyle () {
                let style = {}
                let trueWidth = this.tableWidth + this.barWidth + (this.border ? 2 : 0)
                if (this.maxWidth != 0 && this.maxWidth < this.tableWidth) {
                    trueWidth = this.maxWidth
                    style.width = style.maxWidth = `${trueWidth}px`
                }
                return style
            },

            getStyle () {
                let style = {}
                if (this.headerData) {
                    style.width = `${this.tableWidth}px`
                }
                return style
            }
        },

        watch: {
            // 数据刷新，先剔除老数据
            data () {
                this.initBody()
            },

            columns () {
                this.headerData = [
                    ...this.reBuildHeader()
                ]
                this.initBody()
                if (this.footerData) {
                    this.initFoot()
                }
            },

            total (newData) {
                this.initFoot(newData)
            },

            pages (newPage) {
                this.bpPages = newPage
            }
        },

        methods: {
            initBody () {
                this.bodyData = [
                    ...this.reBuildBody()
                ]
                this.handleResize()
            },

            initFoot () {
                this.footerData = {
                    ...this.reBuildFooter()
                }
                this.handleResize()
            },

            reBuildHeader () {
                let data = []
                let data2 = []
                this.columns.forEach((col, index) => {
                    let ncol = deepCopy(col)
                    ncol.index = index
                    ncol.type = ncol.type || 'normal'
                    ncol.align = ncol.align || getDefaultAlign(ncol.title)
                    ncol.bodyAlign = ncol.bodyAlign || ncol.align
                    ncol._width = ncol.width = parseInt(ncol.width || getDefaultWidth(ncol.title, this.width))
                    if (ncol.father) {
                        ncol.father.forEach((col2, index2) => { // 组装多级表头
                            if (!data2[index2]) {
                                data2[index2] = []
                            }
                            if (col2) {
                                data2[index2].push(col2)
                            }
                        })
                    }
                    data[index] = ncol
                })
                this.headerData2 = data2
                return data
            },

            reBuildBody () {
                let data = []
                this.data.forEach((row, index) => {
                    let nrow = deepCopy(row)
                    nrow._index = index
                    nrow._checked = false
                    this.columns.forEach((col) => {
                        // 过滤函数
                        nrow[`_${col.key}`] = nrow[col.key]
                        if (col.filterFunc) { // 过滤函数处理
                            let val = nrow[col.key]
                            if (isNull(val)) {
                                val = ''
                            }
                            nrow[`_${col.key}`] = col.filterFunc(val, nrow, col)
                        }
                    })
                    data[index] = nrow
                })
                return data
            },

            // 预留数据处理函数
            reBuildFooter () {
                let data = {}
                if (Object.keys(this.total).length == 0) {
                    return data
                }
                this.columns.forEach((col) => {
                    data[col.key] = this.total[col.key] || ''
                    data[`_${col.key}`] = this.total[col.key] || ''
                    if (col.filterFunc) {
                        data[`_${col.key}`] = col.filterFunc(data[col.key] || '', this.total, col)
                    }
                })
                return data
            },

            createTip () {
                return createTip()
            },

            // 获取滚动条宽度
            getBarWidth () {
                let odiv = document.createElement('div'), // 创建一个div
                    styles = {
                        width: '100px',
                        height: '100px',
                        overflowY: 'scroll' // 让他有滚动条
                    }, i, scrollbarWidth
                for (i in styles) {
                    odiv.style[i] = styles[i]
                }
                document.body.appendChild(odiv)
                scrollbarWidth = odiv.offsetWidth - odiv.clientWidth
                odiv.remove()
                return scrollbarWidth
            },

            // 滚动条响应
            scrollHandle (e) {
                e = e.target
                if (this.rollleft != e.scrollLeft) {
                    this.rollleft = e.scrollLeft

                    e.querySelectorAll('.fixed').forEach((item) => {
                        item.style.transform = 'translateX(' + e.scrollLeft + 'px)'
                    })
                } else {  // 固定栏位移
                    this.setTransformFoot(e) // 表尾位移
                    this.$refs.bpHead.style.transform = 'translateY(' + e.scrollTop + 'px)'  // 表头位移
                }
                if (this.loadMore) { // 加载更多
                    if (e.scrollTop + e.offsetHeight >= e.scrollHeight) {
                        this.$emit('load-more')
                    }
                }
            },

            handleResize () { // 重置表格宽度和滚动条
                let box = this.$refs.box
                if (box) {    // 有表格的时候
                    box.scrollTop = 0 // 复原top
                    box.scrollLeft = 0 // 复原left
                    this.setTransformFoot(box)
                    this.mathWidth = this.headerData.map(cell => cell.width).reduce((a, b) => a + b, 0)
                    let bw = box.clientWidth
                    if (this.maxWidth == 0 && bw > this.mathWidth) {
                        this.setTween(bw)
                    } else {
                        this.tableWidth = this.mathWidth
                    }
                }
            },
            setTween (bw) { // 设置补间
                let len = this.headerData.length
                let tween = Math.floor((bw - this.mathWidth) / len)
                let noTween = 0
                for (let i = 0; i < len; i++) {
                    if (this.headerData[i].noTween) {
                        noTween += tween
                    } else {
                        this.headerData[i]._width = this.headerData[i].width + tween
                    }
                    if (i == len - 1) {
                        this.headerData[i]._width += ((bw - this.mathWidth) % len + noTween)  // 补间最后一列加余数
                    }
                }
                this.tableWidth = bw
            },

            setTransformFoot (e, to = 0) { // 底部栏位移
                if (!this.$refs.bpFoot) {
                    return
                }
                if (e.scrollHeight > e.clientHeight) {
                    to = e.clientHeight - e.scrollHeight + e.scrollTop
                }
                this.$refs.bpFoot.style.transform = 'translateY(' + to + 'px)'
            },

            toggleSelect (_index) {
                let data = {}
                for (let i in this.bodyData) {
                    if (parseInt(i) === _index) {
                        data = this.bodyData[i]
                    }
                }
                const status = !data._checked
                this.bodyData[_index]._checked = status
                const selection = this.getSelection()
                this.$emit('on-select', selection)
            },

            // 获取当前选中对象数组
            getSelection () {
                let selectionIndexes = []
                for (let item of this.bodyData) {
                    if (item._checked) {
                        selectionIndexes.push(item)
                    }
                }
                return selectionIndexes
            },

            handleClick () {
                // 放置 Checkbox 冒泡
            },

            selectAll (status) {
                for (const data of this.bodyData) {
                    this.bodyData[data._index]._checked = status
                }
                const selection = this.getSelection()
                this.$emit('on-select', selection)
            },

            changePage (data) {
                let p = parseInt(data)
                if (p > 0 && p <= Math.ceil(this.bpPages.total / (this.bpPages.size || 10))) {
                    // 有效页码，上浮翻页
                    this.$emit('change-page', p)
                }
            }
        },

        beforeDestroy: function () {
            if (window.removeEventListener) {
                window.removeEventListener('resize', this.handleResize, false)
            } else {
                window.detachEvent('onresize', this.handleResize)
            }
        }
    }
</script>

<style lang="less">
    @cfont: #999;
    @cborder: #dddee1;
    @chborder: #43affc;
    @chfont: white;
    .bpTable {
        .table-content {
            .table-box {
                th {
                    .ivu-tooltip {
                        position: absolute;
                        top: -2px;
                    }
                }
                .ivu-checkbox-wrapper {
                    margin-right: 0px;
                }
                .overflowword {
                    .ivu-tooltip {
                        width: 100%;
                        display: inline-block;
                        overflow: hidden;
                        text-overflow: ellipsis
                    }
                }
            }
            .table-box::-webkit-scrollbar-track {
                background-color: #e1e1e1;
            }
            .table-box::-webkit-scrollbar-thumb {
                border-radius: 5px;
                background-color: #b7b7b7;
            }
        }
        .pages {
            padding: 20px 20px;
            overflow: hidden;
            color: @chborder;
            .pages-total {
                float: left;
                font-weight: bold;
                line-height: 32px;
                height: 32px;
            }
            .pages-box {
                float: right;
                .ivu-page {
                    float: left;
                }
                a {
                    color: @cfont;
                }
                .ivu-page-item, .ivu-page-prev, .ivu-page-next, .ivu-page-item-jump-prev, .ivu-page-item-jump-next {
                    border-color: @cborder;
                }
                .ivu-page-item:hover, .ivu-page-prev:hover, .ivu-page-next:hover, .ivu-page-item-jump-prev:hover, .ivu-page-item-jump-next:hover {
                    border-color: @chborder;
                }
                .ivu-page-item-active {
                    background-color: @chborder;
                    border-color: @chborder;
                }
                .ivu-page-item-active a {
                    color: @chfont;
                }
                .page-jump {
                    float: left;
                    .jump-input {
                        margin: 0 8px;
                        width: 50px;
                        float: left;
                        .ivu-input {
                            text-align: center;
                            color: @cfont;
                        }
                        .ivu-input:hover {
                            border-color: @chborder;
                        }
                    }
                    .jump-button {
                        cursor: pointer;
                        color: @chborder;
                        border: 1px solid @chborder;
                        background-color: white;
                        padding: 6px 10px;
                        border-radius: 4px;
                        float: left;
                    }
                }
            }
        }
    }

    .fillAll {
        .pages {
            padding: 20px 0;
        }
    }

</style>
<style lang="less" scoped>
    @cbg: #f9f9f9;
    @cborder: #e7e7e7;
    @cborderB: #ececec;
    @chover: #ecf4f9;
    @cfborder: #cfcfcf;
    .table-content {
        position: relative;
        top: 0;
        left: 0;
        display: block;
    }

    .table-box {
        position: relative;
        top: 0;
        left: 0;
        overflow: auto;
        transform: translate(0, 0);
        transition: all 1s ease .1s;
        .bpcell {
            width: 95%;
            padding: 0;
            margin: 0 auto;
            vertical-align: middle;
            text-overflow: ellipsis;
            word-break: break-all;
            box-sizing: border-box;
            span {
                padding: 0 6px;
            }
        }
        .nodata {
            height: 50px;
            text-align: center;
            vertical-align: middle;
            border-bottom: 0px solid white;
        }
        table {
            table-layout: fixed;
            thead {
                //有固定栏时防遮挡
                position: relative;
                z-index: 3;

                display: block;
                border-bottom: 1px solid @cborderB;
                tr {
                    th {
                        background-color: @cbg; //有固定栏时防穿透
                    }
                }
                .fixed {
                    position: relative;
                    z-index: 4;
                }
            }
            tbody {
                //有固定栏时防遮挡
                position: relative;
                z-index: 1;

                display: block;
                tr:hover {
                    td {
                        background-color: @chover;
                    }
                }
                tr {
                    td {
                        border-bottom: 1px solid @cborderB;
                        background-color: white; //有固定栏时防穿透
                    }
                }
                .fixed {
                    position: relative;
                    z-index: 2;
                }
            }
            tfoot {
                font-weight: bold;
                //有固定栏时防遮挡
                position: relative;
                z-index: 3;

                border-top: 2px solid @cfborder;
                display: block;
                td {
                    background-color: @cbg; //有固定栏时防穿透
                }
                .fixed {
                    position: relative;
                    z-index: 4;
                }
            }
        }
        table.bpStripe {
            tbody {
                tr:nth-child(even) {
                    td {
                        background-color: @cbg; //斑马纹
                    }
                }
                tr:hover {
                    td {
                        background-color: @chover;
                    }
                }
            }
        }
    }

    .fixed-b {
        border-right: 1px solid @cborderB;
    }
</style>
