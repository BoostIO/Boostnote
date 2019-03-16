import ReqPromise from 'request-promise'
import ConfigManager from 'browser/main/lib/ConfigManager'
import {languageMaps} from 'browser/components/CodeEditor'

const githubApiBaseUrl = 'api.github.com'
const gitHubHostApi = `${githubApiBaseUrl}`
const userAgent = 'boostnote-app'
const timeoutUnit = 10 * 1000
const config = ConfigManager.get()

function exchangeAccessToken (clientID, clientSecret, authCode) {
  return ReqPromise({
    method: 'POST',
    uri: 'https://github.com/login/oauth/access_token',
    form: {
      client_id: clientID,
      client_secret: clientSecret,
      code: authCode
    },
    json: true,
    timeout: timeoutUnit
  })
}

function getUserProfile (token) {
  const USER_PROFILE_URI = `https://${gitHubHostApi}/user`
  return ReqPromise({
    uri: USER_PROFILE_URI,
    headers: {
      'User-Agent': userAgent
    },
    method: 'GET',
    qs: {
      access_token: token
    },
    json: true,
    timeout: 2 * timeoutUnit
  })
}

function getSingleGist (gistID) {
  const token = config.githubGists.loggedInUserInfo.accessToken
  const URL = `https://${gitHubHostApi}/gists/`
  return ReqPromise({
    uri: URL + gistID,
    headers: {
      'User-Agent': userAgent
    },
    method: 'GET',
    qs: {
      access_token: token
    },
    json: true,
    timeout: 2 * timeoutUnit
  })
}

function getAllGists () {
  const {login, accessToken} = config.githubGists.loggedInUserInfo
  const URL = `https://${gitHubHostApi}/users/${login}/gists`
  return ReqPromise({
    uri: URL,
    headers: {
      'User-Agent': userAgent
    },
    method: 'GET',
    qs: {
      access_token: accessToken
    },
    json: true,
    timeout: 2 * timeoutUnit
  }).then(x => {
    // return Promise.all(x.map(y => Promise.resolve(getSingleGist(y.id))))
    return Promise.all(x.map(y => new Promise(resolve => getSingleGist(y.id).then(x => resolve(x)))))
  })
}

function createSingleGist ({description, files, isPublic}) {
  const token = config.githubGists.loggedInUserInfo.accessToken
  return ReqPromise({
    headers: {
      'User-Agent': userAgent
    },
    method: 'POST',
    uri: `https://${gitHubHostApi}/gists`,
    qs: {
      access_token: token
    },
    body: {
      description: description,
      public: isPublic,
      files: files
    },
    json: true,
    timeout: 2 * timeoutUnit
  })
}

function editSingleGist ({gistId, description, files}) {
  const token = config.githubGists.loggedInUserInfo.accessToken
  return ReqPromise({
    headers: {
      'User-Agent': userAgent
    },
    method: 'PATCH',
    uri: `https://${gitHubHostApi}/gists/${gistId}`,
    qs: {
      access_token: token
    },
    body: {
      description: description,
      files: files
    },
    json: true,
    timeout: 2 * timeoutUnit
  }).catch(x => { throw Error(x) })
}

function deleteSingleGist (gistID) {
  const token = config.githubGists.loggedInUserInfo.accessToken
  return ReqPromise({
    headers: {
      'User-Agent': userAgent
    },
    method: 'DELETE',
    uri: `https://${gitHubHostApi}/gists/${gistID}`,
    qs: {
      access_token: token
    },
    json: true,
    timeout: 2 * timeoutUnit
  })
}

export const EXCHANGE_ACCESS_TOKEN = 'EXCHANGE_ACCESS_TOKEN'
export const GET_ALL_GISTS = 'GET_ALL_GISTS'
export const GET_ALL_GISTS_V1 = 'GET_ALL_GISTS_V1'
export const GET_SINGLE_GIST = 'GET_SINGLE_GIST'
export const GET_USER_PROFILE = 'GET_USER_PROFILE'
export const CREATE_SINGLE_GIST = 'CREATE_SINGLE_GIST'
export const EDIT_SINGLE_GIST = 'EDIT_SINGLE_GIST'
export const DELETE_SINGLE_GIST = 'DELETE_SINGLE_GIST'

export function getGithubApi (selection) {
  switch (selection) {
    case EXCHANGE_ACCESS_TOKEN:
      return exchangeAccessToken
    case GET_USER_PROFILE:
      return getUserProfile
    case GET_SINGLE_GIST:
      return getSingleGist
    case CREATE_SINGLE_GIST:
      return createSingleGist
    case EDIT_SINGLE_GIST:
      return editSingleGist
    case DELETE_SINGLE_GIST:
      return deleteSingleGist
    case GET_ALL_GISTS:
      return getAllGists
  }
}

export function parseMode (val) {
  return languageMaps[val.toLowerCase()]
}
    // schema
    // { snippet item
    //   name: 'example.html',
    //     mode: 'html',
    //       content: "<html>\n<body>\n<h1 id='hello'>Enjoy Boostnote!</h1>\n</body>\n</html>",
    //         linesHighlighted: []
    // }, gist api
    // "files": {
    //   "hello_world.rb": {
    //     "content": "class HelloWorld\n   def initialize(name)\n      @name = name.capitalize\n   end\n   def sayHi\n      puts \"Hello !\"\n   end\nend\n\nhello = HelloWorld.new(\"World\")\nhello.sayHi"
    //   },

export function mapToGist ({ snippets, description, public: isPublic = true, gistId }) {
  const files = snippets.reduce((a, {name, content}) => {
    var validName = name === '' ? 'unnamed' : name
    var validContent = content === '' ? 'empty' : content
    return Object.assign(a, { [validName]: { content: validContent } })
  }, {})
  return {
    files: files, description, isPublic, gistId: gistId
  }
}

export function mapToNote ({description, files, isGisted = false}) {
  const mapped = Object.keys(files).map(key => {
    const item = files[key]
    const { language, content } = item
    const parsed = language ? parseMode(language) : 'text'
    return {
      name: key,
      mode: parsed || 'text',
      content,
      linesHighlighted: []
    }
  })
  return {
    type: 'SNIPPET_NOTE',
    description,
    title: mapped[0].name,
    snippets: mapped,
    isGisted
  }
}
