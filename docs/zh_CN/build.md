# 构建Boostnote

## 环境
* npm: 4.x
* node: 7.x

因为`$ grunt pre-build`的问题，您只能使用`npm v4.x`而不能使用`npm v5.x`。  

## 开发

我们使用Webpack HMR来开发Boostnote。  
在代码根目录下运行下列指令可以以默认配置运行Boostnote。  

### 首先使用yarn安装所需的依赖包。  

```
$ yarn
```

### 接着编译并且运行Boostnote。  

```
$ yarn run dev-start
```

这个指令相当于在两个终端内同时运行`yarn run webpack`和`yarn run hot`。  

如果出现错误`Failed to load resource: net::ERR_CONNECTION_REFUSED`，请尝试重新运行Boostnote。  
![net::ERR_CONNECTION_REFUSED](https://cloud.githubusercontent.com/assets/11307908/24343004/081e66ae-1279-11e7-8d9e-7f478043d835.png)

### 然后您就可以进行开发了

当您对代码作出更改的时候，`webpack`会自动抓取并应用所有代码更改。  

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

您只能使用`npm v5.2.0`而不能使用`npm v5.3.0`。  

接下来您就可以在`dist`目录中找到可执行文件。  

> ### 提示
> 因为此可执行文件并没有被注册，所以自动更新不可用。
> 如果需要，您也可将协同设计(codesign)与验证码(authenticode)使用于这个可执行文件中。  
