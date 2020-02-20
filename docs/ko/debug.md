# Boostnote의 디버그 방법(Electron app)

## 구글 크롬 Developer Tools를 사용한 디버깅

Boostnote는 Electron 애플리케이션이므로 Chromium위에서 작동합니다. 그렇기 때문에 개발자분들은 Google Chrome 브라우저에서 처럼 `Developer Tools`를 사용하실 수 있습니다.

다음과 같이 `Developer Tools`를 실행할 수 있습니다:
![how_to_toggle_devTools](https://cloud.githubusercontent.com/assets/11307908/24343585/162187e2-127c-11e7-9c01-23578db03ecf.png)

`Developer Tools`는 다음과 같이 나타납니다:
![Developer_Tools](https://cloud.githubusercontent.com/assets/11307908/24343545/eff9f3a6-127b-11e7-94cf-cb67bfda634a.png)

에러가 발생할 때에는, 에러메시지가 `console`위에 표시 됩니다.

### 디버깅
예를들면 `debugger`를 사용하여 코드 안에서 다음과 같이 일시 정지지점을 설정할 수 있습니다:

![debugger](https://cloud.githubusercontent.com/assets/11307908/24343879/9459efea-127d-11e7-9943-f60bf7f66d4a.png)

이는 단순한 하나의 예시에 불과합니다. 자기자신에게 가장 잘 맞는 디버그 방법을 찾는 것도 좋을 것 입니다.

  ### 참고
* [디버그에 관한 Google Chrome의 공식 문서](https://developer.chrome.com/devtools)

## 비주얼 스튜디오 코드를 사용한 디버깅

1. **[크롬 디버깅 플러그인](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome 'Install Debugger for Chrome')** 을 비주얼 스튜디오 코드에 설치한 후, 프로그램을 닫았다가 재실행합니다.
2. **Shift+Command+B** 키를 누르거나, **Terminal** 메뉴 하단에 있는 **Run Build Task** 메뉴를 선택한 후 **Build Boostnote** 를 선택합니다. 아니면 터미널에서 곧바로 `yarn run watch`를 실행해도 됩니다.
3. 위의 절차가 실행되고 있을 때, 사이드바 **Activity Bar**에서 **Debug view**를 선택합니다. 키보드 단축키로는 **Shift+Command+D**를 눌러도 됩니다..
4. **Debug configuration**에서 **Boostnote All** 설정을 선택한 후, 초록색 화살표를 클릭하거나 **F5** 키를 누르면 디버깅이 시작됩니다.
5. 이 시점에서는 **Boostnote**가 실행되고 있을 텐데, 두 개의 프로세스가 진행중인 것을 볼 수 있을 겁니다. 바로 **Boostnote Main** 프로세스와 **Boostnote Renderer** 프로세스입니다. 이제 비주얼 스튜디오 코드에서 곧바로 **디버깅 정지지점 (debug breakpoint)** 을 설정할 수 있습니다. 만약에 지정한 **정지지점 (breakpoint)** 이 등록되지 않는다면, **Boostnote Renderer** 와 **Boostnote Main** 프로세스 사이를 번갈아 확인해 보아야 합니다.


### 참고

- [일렉트론 애플리케이션 디버깅 공식 튜토리얼](https://electronjs.org/docs/tutorial/application-debugging)
- [비쥬얼 스튜디오 코드용 크롬 디버깅 플러그인](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome)
