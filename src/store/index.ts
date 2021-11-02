import { InjectionKey } from 'vue'
import { createStore, useStore as baseUseStore, Store, MutationTree } from 'vuex'

export const key: InjectionKey<Store<State>> = Symbol()

export interface State {
  token: string;
  currentUser: any;
}

const state: State = {
  token: "" as string,
  currentUser: null as any
}

export const enum MUTATIONS {
  SET_TOKEN = 'SET_TOKEN',
  SET_CURRENT_USER = 'SET_CURRENT_USER',
  CLEAR_TOKEN = 'CLEAR_TOKEN',
  CLEAR_CURRENT_USER = 'CLEAR_CURRENT_USER'
}

const mutations: MutationTree<State> = {
  [MUTATIONS.SET_TOKEN](state, token: string) {
    state.token = token
  },
  [MUTATIONS.SET_CURRENT_USER](state, currentUser: any) {
    state.currentUser = currentUser
  },
  [MUTATIONS.CLEAR_TOKEN](state) {
    state.token = ""
  },
  [MUTATIONS.CLEAR_CURRENT_USER](state) {
    state.currentUser = null
  }
}

export const store = createStore<State>({ state, mutations })

export function useStore() {
  return baseUseStore(key)
}
