# Build

## 環境

* npm: 6.x
* node: 8.x

## 開発

Webpack HRMを使います。
Boostnoteの最上位ディレクトリにて以下のコマンドを実行して、
デフォルトの設定の開発環境を起動させます。

依存するパッケージをインストールします。

```
$ yarn
```

ビルドして実行します。

```
$ yarn run dev
```

> ### 注意
> 時々、直接リフレッシュをする必要があります。
> 1. コンポーネントのコンストラクタ関数を編集する場合
> 2. 新しいCSSクラスを追加する場合(1.の理由と同じ: CSSクラス名はコンポーネントごとに書きなおされますが、この作業はコンストラクタで行われます。)

## 配布

Gruntを使います。
実際の配布は`grunt`で実行できます。しかし、これにはCodesignとAuthenticodeを実行するタスクが含まれるので、使用しないでください。

代わりに、実行ファイルを作るスクリプトを用意しておきました。

```
grunt pre-build
```

実行ファイルは`dist`から見つかります。この場合、認証されていないため、自動アップデーターは使えません。

必要であれば、この実行ファイルからCodesignやAuthenticodeなどの署名ができます。

## ディストリビューション用パッケージ (deb, rpm)

ディストリビューション用パッケージはLinuxプラットフォーム(Ubuntu や Fedora)上で `grunt build` を実行する事で作成されます。

> 一つの環境で `.deb` と `.rpm` の両方を作成する事が出来ます。


対応するバージョンの `node` と `npm` をインストールした後、必要なパッケージをインストールします。

Ubuntu/Debian:

```
$ sudo apt-get install -y rpm fakeroot
```

Fedora:

```
$ sudo dnf install -y dpkg dpkg-dev rpm-build fakeroot
```

`grunt build` を実行します。

```
$ grunt build
```

`.deb` と `.rpm` は `dist` 配下に作成されます。
