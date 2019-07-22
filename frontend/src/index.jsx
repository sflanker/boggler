import "regenerator-runtime/runtime";

import React from "react";
import { render } from "react-dom"
import { Provider } from "react-redux";
import { applyMiddleware, combineReducers, createStore } from "redux";
import thunk from "redux-thunk"

import { Boggler } from "./boggler";
import { gameStateReducer } from "./gameBoard";
import { notificationsReducer } from "./notifications";

function defaultReducer(state = { appState: {} }, action) {
  if (action.appState) {
    return { ...state, appState: Object.assign({}, state.appState, action.appState) };
  }

  return state;
}

const store = createStore(
  combineReducers({
    appState: defaultReducer,
    notifications: notificationsReducer,
    gameState: gameStateReducer
  }),
  applyMiddleware(thunk)
);

const App = () => (
  <Provider store={store}>
    <Boggler/>
  </Provider>
);

render(<App />, document.getElementById("app"));
