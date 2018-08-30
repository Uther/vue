const widthArray = {
    '_amount': '130', //金额
    '_count': '80',
    '_index': '50',
    '_time' : '180'
}
const alignArray = {
    '_amount': 'right',
    '_count': 'right',
    '_name': 'left',
    'bp_default': 'center'
}
//获取默认表格对齐方式
const getDefaultAlign = (name) => {
    for (let i in alignArray) {
        if (name.indexOf(i.key) !== -1) {
            return i.value
        }
    }
    return alignArray['bp_default']
}
//获取默认表格宽度
const getDefaultWidth = (name, width) => {
    for (let i in widthArray) {
        if (name.indexOf(i.key) !== -1) {
            return i.value
        }
    }
    return width
}
//标题tooltip渲染
const createTip = () => {
    return (h, params) => {
        return h('span',{
                style:{
                    "position":"relative"
                }
            },
            [params.row.title,
                h("Tooltip", {
                    attrs: {
                        transfer: true,
                        placement: params.row.toolTip[1] || "bottom",
                        content: params.row.toolTip[0]
                    },
                    style: {
                        "wordBreak": "keep-all",
                        "whiteSpace": "nowrap",
                    }
                }, [h("i", {
                    class: "iconfont iconTip",
                    domProps: {
                        innerHTML: '&#xe646;'
                    }
                })]
                )
            ]
        )
    }
}
//内容tooltip渲染
const createCellTip = () => {
    return (h, params) => {
        return h("Tooltip", {
                attrs: {
                    transfer: true,
                    placement: params.column.cellTip[0] || "bottom",
                    content: params.row['_'+params.column.key]
                },
                style: {
                    "wordBreak": "keep-all",
                    "whiteSpace": "nowrap",
                }
            }, params.row['_'+params.column.key] || "-"
        )
    }
}
//内容title渲染
const createTitle = () => {
    return (h, params) => {
        return h("span", {
            attrs: {
                title: params.row['_'+params.column.key] || "-"
            }
        }, params.row['_'+params.column.key] || "-")
    }
}
//input渲染
const createInput = () => {
    return (h, params) => {
        return h(BPInput, {
            props: {
                value: params.row['_'+params.column.key]
            },
            attrs: {
                type: 'text',
            },
            on: {
                "input": (e) => {
                    params.value = e
                    params.column.input(params)
                }
            }
        })
    }
}
//内容链接渲染
const createLink = () => {
    return (h, params) => {
        let links = [], i, j, arr
        arr = params.column.buttons
        if (params.row['_'+params.column.key] && typeof params.row['_'+params.column.key] === 'object') {
            arr = params.row['_'+params.column.key]
        }
        if (arr) {
            for (i in arr) {
                let item = arr[i]
                if(item.case && item.case.length > 0){
                    let total = item.case.length
                    let count = 0
                    let caseType = (item.caseType && item.caseType == 'OR') ? 'OR' : 'AND'
                    for(let cas of item.case){
                        for(let ca in cas){
                            if(!isNull(params.row[ca]) && params.row[ca] == cas[ca]){
                                count++
                            }
                        }
                    }
                    if((caseType == 'AND' && total != count) || (caseType == 'OR' && count < 1)){
                        continue
                    }
                }
                if(item.permission && (!item.disabled || item.disabled == undefined)){
                    links.push(h('a', {
                        on: {
                            click: () => {
                                if (item.key) {
                                    params.key = item.key
                                }
                                params.column.link(params)
                            }
                        },
                        directives: [ //权限
                            {
                                name: 'permission',
                                value: item.permission,
                                arg: item.arg
                            }
                        ]
                    }, item.title || params.row['_'+params.column.key]))
                }else {
                    links.push(h('a', {
                        on: {
                            click: () => {
                                if (item.key) {
                                    params.key = item.key
                                }
                                params.column.link(params)
                            }
                        },
                        attrs: {
                            disabled: item.disabled
                        },
                    }, item.title || params.row['_'+params.column.key]))
                }
            }
        } else {
            let noLink = false
            if(params.column.noLink){
                for(let its of params.column.noLink){
                    for(let it in its){
                        if(!isNull(params.row[it]) && params.row[it] == its[it]){
                            noLink = true
                            break
                        }
                    }
                }
            }
            if(noLink){
                links.push(params.row['_'+params.column.key])
            }else{
                links.push(h('a', {
                    on: {
                        click: () => {
                            params.column.link(params)
                        }
                    },
                    attrs: {
                        disabled: params.column.disabled
                    },
                }, params.row['_'+params.column.key]))
            }

        }
        return h("div", {}, links)
    }
}
const deepCopy = (data) => {
    const t = (typeof data)
    let o

    if (data && t === 'object') {
        o = (data.constructor == Array) ? [] : {}
    } else {
        return data
    }

    if (data.constructor == Array) {
        for (let i = 0, j = data.length; i < j; i++) {
            o.push(deepCopy(data[i]))
        }
    } else if (t === 'object') {
        for (let i in data) {
            o[i] = deepCopy(data[i])
        }
    }
    return o
}
const isNull = (val) => {
    if (val == null || val == undefined){
        return true
    }
    var str = val.toString()
    if (str.replace(/\s/g, "") == "" || str == "null" || str == "undefined"){
        return true
    }
    return false
}

export {deepCopy, isNull, getDefaultWidth, getDefaultAlign, createTip, createInput, createCellTip, createLink, createTitle}
