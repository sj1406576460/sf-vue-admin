import store from '@/store'
import * as _ from 'lodash'

/**
 * @param {Array} value
 * @returns {Boolean}
 * @example see @/views/permission/directive.vue
 */
export default function checkPermission(value) {
  if (value && value instanceof Array && value.length > 0) {
    const roles = store.getters && store.getters.roles
    const permissionRoles = value

    const hasPermission = roles.some(role => {
      return permissionRoles.includes(role)
    })
    return hasPermission
  } else {
    console.error(`need roles! Like v-permission="['admin','editor']"`)
    return false
  }
}

/**
 * 遍历获取$service下定义的权限，需要权限的Api必须定义Service且需要使用@Permission定义权限
 */
export function flatPerms(obj) {
  let list = []
  _.keys(obj).forEach(i => {
    const { permission } = obj[i]
    if (permission) {
      list = _.concat(list, [Object.values(permission)].flat())
    } else {
      const tmp = flatPerms(obj[i])
      if (tmp && tmp.length > 0) {
        list = _.concat(list, flatPerms(obj[i]))
      }
    }
  })
  return list
}

/**
 * 处理权限
 */
export function filterPerms(index, arr, op) {
  const key = arr[index]
  const i = _.findIndex(op, (e) => e.label === key)
  if (i >= 0) {
    // 存在则继续遍历
    filterPerms(index + 1, arr, op[i].children)
  } else {
    const isLast = index === arr.length - 1 // 是否为最后一个
    const value = {
      value: key,
      label: key,
      children: isLast ? null : []
    }
    op.push(value)
    if (!isLast) {
      filterPerms(index + 1, arr, op[op.length - 1].children || [])
    }
  }
}

/**
 * 处理菜单数据渲染至表格
 */
export function filterMenuToTable(menus, parentMenu) {
  const res = []
  menus.forEach(menu => {
    // 根级别菜单渲染
    let realMenu
    if (!parentMenu && !menu.parentId && menu.type === 1) {
      // 根菜单
      realMenu = { ...menu }
    } else if (!parentMenu && !menu.parentId && menu.type === 0) {
      // 根目录
      const childMenu = filterMenuToTable(menus, menu)
      realMenu = { ...menu }
      realMenu.children = childMenu
    } else if (parentMenu && parentMenu.id === menu.parentId && menu.type === 1) {
      // 子菜单下继续找是否有子菜单
      const childMenu = filterMenuToTable(menus, menu)
      realMenu = { ...menu }
      realMenu.children = childMenu
    } else if (parentMenu && parentMenu.id === menu.parentId && menu.type === 0) {
      // 如果还是目录，继续递归
      const childMenu = filterMenuToTable(menus, menu)
      realMenu = { ...menu }
      realMenu.children = childMenu
    } else if (parentMenu && parentMenu.id === menu.parentId && menu.type === 2) {
      realMenu = { ...menu }
    }
    // add curent route
    if (realMenu) {
      realMenu.pid = menu.id
      res.push(realMenu)
    }
  })
  return res
}

/**
 * 渲染菜单至树形控件 过滤权限
 */
export function filterMenuToTree(menus, parentMenu) {
  const res = []
  menus.forEach(menu => {
    let node
    if (menu.type === 2) {
      // 权限直接return
      return
    }
    if (!parentMenu && !menu.parentId && menu.type === 1) {
      // 根菜单
      node = { label: menu.name }
    } else if (!parentMenu && !menu.parentId && menu.type === 0) {
      // 根目录
      const childNode = filterMenuToTree(menus, menu)
      node = { label: menu.name }
      node.children = childNode
    } else if (parentMenu && parentMenu.id === menu.parentId && menu.type === 1) {
      // 子菜单则停止
      node = { label: menu.name }
    } else if (parentMenu && parentMenu.id === menu.parentId && menu.type === 0) {
      // 如果还是目录，继续递归
      const childNode = filterMenuToTree(menus, menu)
      node = { label: menu.name }
      node.children = childNode
    }

    if (node) {
      node.pid = menu.id
      res.push(node)
    }
  })
  return res
}
