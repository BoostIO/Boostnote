# 构建Boostnote

## 环境

* npm: 6.x
* node: 8.x

## 开发

我们使用Webpack HMR来开发Boostnote。
在代码根目录下运行下列指令可以以默认配置运行Boostnote。

### 首先使用yarn安装所需的依赖包。

```
$ yarn
```

### 接着编译并且运行Boostnote。

```
$ yarn run dev
```

> ### 提示
> 在如下情况中，您可能需要重新运行Boostnote才能应用代码更改
> 1. 当您在修改了一个组件的构造函数的时候When editing a constructor method of a component
> 2. 当您新建了一个CSS类的时候（其实这和第1项是相同的，因为每个CSS类都需在组件的构造函数中被重写）

## 部署

我们使用Grunt来自动部署Boostnote。
因为部署需要协同设计(codesign)与验证码(authenticode)，所以您可以但我们不建议通过`grunt`来部署。
所以我们准备了一个脚本文件来生成执行文件。

```
grunt pre-build
```

接下来您就可以在`dist`目录中找到可执行文件。

> ### 提示
> 因为此可执行文件并没有被注册，所以自动更新不可用。
> 如果需要，您也可将协同设计(codesign)与验证码(authenticode)使用于这个可执行文件中。
