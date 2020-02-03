# Build

## 환경

* npm: 6.x
* node: 8.x

## 개발

개발에 있어서 Webpack HRM을 사용합니다.
다음과 같은 명령을 프로젝트 디렉토리에서 실행하면, 기본 설정을 사용 할 수 있습니다.

먼저, yarn을 이용해서 필요한 패키지들을 설치합니다.

```
$ yarn
```

그 다음, 아래의 명령으로 빌드를 끝내고 자동적으로 어플리케이션을 실행합니다.

```
$ yarn run dev
```

> ### 주의
> 가끔 직접 리프레쉬를 해주어야 하는 경우가 있습니다.
> 1. 콤포넌트의 컨스트럭터 함수를 수정할 경우
> 2. 새로운 CSS코드를 추가할 경우(1.과 같은 이유: CSS클래스는 콤포넌트마다 다시 만들어 지는데, 이 작업은 컨스트럭터에서 일어납니다.)

## Pull Request에 사용된 코드를 적용하는 방법
관련된 Pull request 페이지를 방문하여, url 스트링 마지막에 표기된 PR 번호를 확인합니다.
<pre>
https://github.com/BoostIO/Boostnote/pull/2794
</pre>
아래의 커맨드를 실행하면서, \<PR> 대신에 위에서 확인한 번호를 입력합니다 (부등호 신호는 빼고 입력하세요).
위에 보여진 예시의 경우, \<PR> 자리에 2794를 입력하면 됩니다.

_본인의 로컬 컴퓨터에 마스터 브랜치가 복사되어 있지 않은 경우_
```
git clone https://github.com/BoostIO/Boostnote.git
cd Boostnote
git fetch origin pull/<PR>/head:<PR>
git checkout <PR>
```

_이미 마스터 브랜치를 로컬 컴퓨터에 저장해둔 경우_
```
git fetch origin pull/<PR>/head:<PR>
git checkout <PR>
```

_To compile and run the code_
```
yarn
yarn run dev
```

## 배포

Boostnote에서는 배포 자동화를 위하여 그런트를 사용합니다.
실제 배포는 `grunt`로 실행할 수 있습니다. 하지만, 여기엔 Codesign과 Authenticode의 과정이 포함되어있기 때문에 사용 하셔선 안됩니다.

그래서, 실행파일만을 만드는 스크립트를 준비해 뒀습니다.

```
grunt pre-build
```

실행 파일은 `dist`에서 찾을 수 있습니다. 이 경우, 인증이 되어있지 않기 때문에 업데이터는 사용할 수 없습니다.

필요로 하다면, 이 실행파일에 Codesign나 Authenticode등의 서명을 할 수 있습니다.

## 독자적인 배포판을 제작하는 방법 (deb, rpm)

배포판 패키지를 제작하려면 (우분투, 페도라 등) 리눅스 플랫폼에서 `grunt build` 커맨드를 실행하면 됩니다.

> 참조: 동일한 환경에서 `.deb` 파일과 `.rpm` 파일을 모두 만들 수 있습니다.

지원되는 버전의 `node`와 `npm`을 설치한 다음, 빌드에 필요한 패키지를 설치합니다.

우분투/데비안 환경 (Ubuntu/Debian):

```
$ sudo apt-get install -y rpm fakeroot
```

페도라 환경 (Fedora):

```
$ sudo dnf install -y dpkg dpkg-dev rpm-build fakeroot
```

그 다음 `grunt build` 커맨드를 실행합니다.

```
$ grunt build
```

`dist` 디렉토리에 `.deb` 파일과 `.rpm` 파일이 새롭게 생성됩니다.
