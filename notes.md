# 项目记录

## status code 整理
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 405 Method Not Allowed
- 406 Not Acceptable
- 412 Precondition Failed
- 417 Expectation Failed
- 422 Unprocessable Entity
- 424 Failed Dependency

## Authentication vs Authorization
- Authentication: means confirming your own identity
- Authorization means being allowed access to the system

## mongodb 等非关系数据库表之间的设计
- 可以使用 Embedding: 直接将一个文档嵌入另一个文档(表)
- 也可以用 Referenceing: 一个文档引用另一个文档的 ObjectId, m-m 情况 ref 需要为一个数组

## 参考

项目基本参考了这篇文章 [typescript express tutorial routing controllers middleware](https://wanago.io/2018/12/03/typescript-express-tutorial-routing-controllers-middleware/)

自己所遇到的问题总结:

关于 mongoose object_id 报错:
- https://stackoverflow.com/questions/17223517/mongoose-casterror-cast-to-objectid-failed-for-value-object-object-at-path

对于声明 Class 类型:
- https://stackoverflow.com/questions/39392853/is-there-a-type-for-class-in-typescript-and-does-any-include-it

Class 里成员进行可选:
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html#optional-class-properties

类型里面将所有字段变成可选
- https://stackoverflow.com/questions/39713349/make-all-properties-within-a-typescript-interface-optional

jwt 验证时同步与异步的问题:
- https://github.com/auth0/node-jsonwebtoken/issues/111