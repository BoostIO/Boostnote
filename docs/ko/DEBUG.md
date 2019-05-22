# Boostnote의 디버그 방법(Electron app)

Boostnote는 Electron 애플리케이션이므로 Chromium위에서 작동합니다. 그렇기 때문에 개발자분들은 Google Chrome 브라우저에서 처럼 `Developer Tools`를 사용하실 수 있습니다.

다음과 같이 `Developer Tools`를 실행할 수 있습니다:
![how_to_toggle_devTools](https://cloud.githubusercontent.com/assets/11307908/24343585/162187e2-127c-11e7-9c01-23578db03ecf.png)

`Developer Tools`는 다음과 같이 나타납니다:
![Developer_Tools](https://cloud.githubusercontent.com/assets/11307908/24343545/eff9f3a6-127b-11e7-94cf-cb67bfda634a.png)

에러가 발생할 때에는, 에러메시지가 `console`위에 표시 됩니다.

## 디버깅
예를들면 `debugger`를 사용하여 코드 안에서 다음과 같이 일시 정지지점을 설정할 수 있습니다:

![debugger](https://cloud.githubusercontent.com/assets/11307908/24343879/9459efea-127d-11e7-9943-f60bf7f66d4a.png)

이는 단순한 하나의 예시에 불과합니다. 자기자신에게 가장 잘 맞는 디버그 방법을 찾는 것도 좋을 것 입니다.

## 참고
* [디버그에 관한 Google Chrome의 공식 문서](https://developer.chrome.com/devtools)
