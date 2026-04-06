# 小面包AI图库

## Current State

后端对写操作加了 principal 权限校验，但管理员用账号密码登录时 token 未正确存入 sessionStorage，导致 actor 以匿名身份调用后端被拒绝。

## Requested Changes (Diff)

### Add
- 无

### Modify
- `src/backend/main.mo`：移除所有写操作的 principal 权限校验
- `src/frontend/src/pages/AdminLoginPage.tsx`：登录成功后存储 caffeineAdminToken 到 sessionStorage

### Remove
- 后端所有 AccessControl 写操作校验

## Implementation Plan

1. 修改 main.mo 删除权限校验
2. 修改 AdminLoginPage.tsx 存储 token
