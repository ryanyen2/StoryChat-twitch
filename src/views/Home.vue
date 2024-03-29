<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>StoryChat</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">StoryChat</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <div v-if="!token.length" class="login-container">
          <ion-row>
            <ion-col size="5">
              <div class="wrapper">
                <div class="border-circle" id="one"></div>
                <div class="border-circle" id="two"></div>
                <div class="background-circle">
                  <div class="triangle-light"></div>
                  <div class="body"></div>
                  <span class="shirt-text">S</span>
                  <span class="shirt-text">T</span>
                  <span class="shirt-text">♥</span>
                  <span class="shirt-text">R</span>
                  <span class="shirt-text">Y</span>
                  <div class="triangle-dark"></div>
                </div>
                <div class="head">
                  <div class="ear" id="left"></div>
                  <div class="ear" id="right"></div>
                  <div class="hair-main">
                    <div class="sideburn" id="left"></div>
                    <div class="sideburn" id="right"></div>
                    <div class="hair-top"></div>
                  </div>
                  <div class="face">
                    <div class="hair-bottom"></div>
                    <div class="nose"></div>
                    <div class="eye-shadow" id="left">
                      <div class="eyebrow"></div>
                      <div class="eye"></div>
                    </div>
                    <div class="eye-shadow" id="right">
                      <div class="eyebrow"></div>
                      <div class="eye"></div>
                    </div>
                    <div class="mouth"></div>
                    <div class="shadow-wrapper">
                      <div class="shadow"></div>
                    </div>
                  </div>
                </div>
                <span class="music-note" id="one">&#9835;</span>
                <span class="music-note" id="two">&#9834;</span>
              </div>
            </ion-col>
            <ion-col size="1" />
            <ion-col size="5">
              <ion-card>
                <ion-card-header>
                  <ion-card-subtitle>Welcome to</ion-card-subtitle>
                  <ion-card-title> StoryChat Study</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-item>
                    <ion-label>Name</ion-label>
                    <ion-input v-model="trialInfo.username" clear-input type="text" placeholder="Input registered name"></ion-input>
                  </ion-item>
                  <ion-item>
                    <ion-label>Email</ion-label>
                    <ion-input v-model="trialInfo.email" clear-input type="email" placeholder="Input registered email"></ion-input>
                  </ion-item>
                  <ion-item>
                    <ion-label>Trial ID</ion-label>
                    <ion-input v-model="trialInfo.trialId" type="number" placeholder="number only"></ion-input>
                  </ion-item>
                  <ion-item>
                    <ion-label> {{trialInfo.withStory? 'With Story' : 'Without Story'}} </ion-label>
                    <ion-toggle color="primary" v-model="trialInfo.withStory"></ion-toggle>
                  </ion-item>
                </ion-card-content>
              </ion-card>
              <ion-button
                  style="margin-top: 20px"
                  @click.end="login"><strong class="capitalize">Login with Twitch</strong></ion-button>
            </ion-col>
            <ion-col size="1" />
          </ion-row>
        </div>
        <div v-if="token.length && currentUser">
          <ion-card>
            <ion-card-header>
              <ion-avatar>
                <img :src="currentUser.profilePictureUrl" alt="profile_avatar">
              </ion-avatar>
              <ion-card-subtitle>{{ currentUser.email }}</ion-card-subtitle>
              <ion-card-title>Hi! {{ currentUser.displayName }}</ion-card-title>
            </ion-card-header>

            <ion-card-content>
              <ion-button
                  fill="outline"
                  @click.end="logout"
                  color="warning"
              > Logout
              </ion-button>

              <ion-searchbar v-model="searchWords" animated placeholder="Search Channel"></ion-searchbar>
            </ion-card-content>
          </ion-card>
          <ion-card v-for="stream in streams" :key="stream.id" @click.end="connect(stream)">
            <ion-card-header>
              <ion-card-title>{{
                  stream['userDisplayName'] ? stream.userDisplayName : stream.displayName
                }}
              </ion-card-title>
              <ion-card-subtitle>{{ stream['title'] ? stream.title : stream.gameName }}</ion-card-subtitle>
            </ion-card-header>
            <ion-alert
                :is-open="openAlert"
                header="Connect?"
                sub-header="redirect page alert"
                :message="`connect chat to ${stream['userDisplayName']? stream.userDisplayName : stream.displayName}`"
                :buttons="alertButtons"
                @didDismiss="openAlert = false"
            >
            </ion-alert>
            <ion-card-content>
              <ion-chip>
                <ion-icon :icon="people" color="primary"></ion-icon>
                <ion-label>{{ stream['viewers'] ? stream.viewers : stream.language }}</ion-label>
              </ion-chip>
              <ion-chip>
                <ion-icon :icon="gameControllerOutline" color="secondary"></ion-icon>
                <ion-label>{{ stream.gameName }}</ion-label>
              </ion-chip>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="js">
import {ApiClient} from '@twurple/api';
import {StaticAuthProvider} from "@twurple/auth";
import {db} from '@/utils/firebase.ts';
import {ref, set, get } from 'firebase/database';

import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonAvatar,
  IonAlert,
  IonChip,
  IonLabel,
  IonIcon,
  IonItem,
  IonRow,
  IonCol,
  IonSearchbar,
    IonInput,
    IonToggle,
} from "@ionic/vue";

import {people, gameControllerOutline} from 'ionicons/icons';
import {useStore, MUTATIONS} from "@/store";

let apiClient;

export default {
  name: "Folder",
  components: {
    IonButtons,
    IonContent,
    IonHeader,
    IonMenuButton,
    IonRow,
    IonCol,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButton,
    IonLabel,
    IonAlert,
    IonToggle,
    IonAvatar,
    IonItem,
    IonChip,
    IonIcon,
    IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,
    IonSearchbar,
    IonInput
  },
  data() {
    return {
      store: null,
      trialInfo: {
        username: "",
        email: "",
        trialId: 0,
        withStory: false,
      },

      token: "",
      currentUser: null,
      streams: [],
      searchWords: "",
      searchedStreams: [],

      openAlert: false,
      selectedStream: null,
      alertButtons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            this.openAlert = false
          },
        },
        {
          text: 'Ok',
          handler: () => {
            this.$router.push({
              name: `chat`,
              params: {
                withStory: this.trialInfo.withStory,
                trialId: this.trialInfo.trialId,
                ...this.selectedStream
              }
            });
          },
        },
      ],
    };
  },
  watch: {
    async searchWords(val) {
      if (val.length > 1) {
        const channels = await apiClient.search.searchChannels(val, {
          liveOnly: true,
          limit: 20
        })
        this.streams = channels.data
      }
    }
  },
  methods: {
    async login() {
      if (this.trialInfo.trialId < 0 || !this.trialInfo.email || !this.trialInfo.username) {
        alert('Please filled out all the fields')
      } else {
        let redirectUrl = new URL(window.location.href)
        redirectUrl.port = ''
        redirectUrl = redirectUrl.toString().replace(/\/$/, "")
        window.localStorage.setItem('trialId', this.trialInfo.trialId)
        window.localStorage.setItem('withStory', this.trialInfo.withStory)

        const trialName = `trial${this.trialInfo.trialId}`
        const trialRef = ref(db, `trials/` + trialName)
        console.log('Trial: ', this.trialInfo)

        await get(trialRef).then(async (snapshot) => {
          if (!snapshot.exists()) {
            await set(trialRef, {
              trialId: this.trialInfo.trialId,
              trialName: `trial${this.trialInfo.trialId}`,
              withStory: this.trialInfo.withStory,
              createdAt: new Date().getTime(),
              connectedUsers: [],
            }).then(res => console.log(res)).catch(console.error)
          }
        }).catch((error) => {
          console.error(error);
        });
        window.open(
            `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${process.env.VUE_APP_CLIENT_ID}&redirect_uri=${redirectUrl.toString()}&scope=viewing_activity_read user_read channel_read chat:read channel:moderate chat:edit`,
            '_self',
        ).focus()
      }
    },
    async connect(stream) {
      const user = await stream.getUser()

      this.selectedStream = {
        id: stream.id,
        gameId: stream.gameId,
        gameName: stream.gameName,
        startDate: stream.startDate,
        // title: stream['title']? stream.title : null,
        userDisplayName: user.displayName,
        userId: user.id,
        userName: user.name
      }

      this.openAlert = true
    },
    async logout() {
      this.store.commit(MUTATIONS.CLEAR_CURRENT_USER);
      this.store.commit(MUTATIONS.CLEAR_TOKEN);
      history.pushState("", document.title, window.location.pathname + window.location.search);
      window.location.reload();
    }
  },
  setup() {
    return {people, gameControllerOutline}
  },
  async mounted() {
    this.store = useStore()
    if (window.location.hash.length > 0) {
      const hash = window.location.hash.substr(1);
      const hashParse = hash.split('&').reduce(function (res, item) {
        const parts = item.split('=');
        res[parts[0]] = parts[1];
        return res;
      }, {})

      this.token = hashParse['access_token']

      const authProvider = new StaticAuthProvider(
          process.env.VUE_APP_CLIENT_ID,
          this.token
      )
      await this.store.commit(MUTATIONS.SET_TOKEN, this.token)

      apiClient = new ApiClient({authProvider})
      this.currentUser = await apiClient.users.getMe()
      await this.store.commit(MUTATIONS.SET_CURRENT_USER, this.currentUser)

      this.trialInfo.trialId = window.localStorage.getItem('trialId')
      this.trialInfo.withStory = window.localStorage.getItem('withStory')
      console.log('>>>', this.trialInfo.withStory)

      const storedUserInfo = {
        username: this.currentUser.name,
        email: this.currentUser.email,
        displayName: this.currentUser.displayName,
        profilePictureUrl: this.currentUser.profilePictureUrl,
        description: this.currentUser.description,
        views: this.currentUser.views,
        type: this.currentUser.type,
        loginTime: new Date().getTime(),
        localeTime: new Date().toLocaleString().replace(',', ''),
      }

      await set(ref(db, `trials/trial${this.trialInfo.trialId}/connectedUsers/${this.currentUser.name}`), {...storedUserInfo})

      const returnStreams = await apiClient.streams.getStreams({
        language: 'en',
        type: 'live'
      })
      this.streams = returnStreams.data
    }
  }
};
</script>

<style scoped>
#container {
  text-align: center;
  position: relative;
  left: 0;
  right: 0;
  top: 0;
  /*transform: translateY(-50%);*/
}

.login-container {
  text-align: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 5rem;
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;
  color: #8c8c8c;
  margin: 0;
}

#container a {
  text-decoration: none;
}


body, html {
  width: 100%;
  height: 100%;
  margin: 0;
  display: table;
  text-align: center;
}

.wrapper {
  display: table-cell;
  vertical-align: middle;
  position: relative;
}

.background-circle {
  width: 400px;
  height: 400px;
  border-radius: 100%;
  overflow: hidden;
  margin: 0 auto;
  background: #95B3BF;
  position: relative;
  -webkit-mask-image: -webkit-radial-gradient(#BADA55, #BADA55);
  -moz-mask-image: -webkit-radial-gradient(#BADA55, #BADA55);
  -o-mask-image: -webkit-radial-gradient(#BADA55, #BADA55);
  -ms-mask-image: -webkit-radial-gradient(#BADA55, #BADA55);
  animation: grow 0.7s 1 ease;
  -webkit-animation: grow 0.7s 1 ease;
  transform-origin: center;
}

.border-circle {
  width: 399px;
  height: 399px;
  border-radius: 100%;
  position: absolute;
  left: 50%;
  top: 50%;
  margin-left: -220px;
  margin-top: -220px;
  border: 10px solid #FCB040;
  -webkit-transform: scale(0);
  transform: scale(0);
  -webkit-transform-origin: center;
  transform-origin: center;
}

.border-circle#one {
  animation: border-pulse 1s 3.1s 1 ease;
  animation-fill-mode: forwards;
  -webkit-animation: border-pulse 1s 3.1s 1 ease;
  -webkit-animation-fill-mode: forwards;
}

.border-circle#two {
  animation: border-pulse 1s 3.3s 1 ease;
  animation-fill-mode: forwards;
  -webkit-animation: border-pulse 1s 3.3s 1 ease;
  -webkit-animation-fill-mode: forwards;
}

.body {
  width: 285px;
  height: 600px;
  margin: 0 auto;
  background: #222;
  border-radius: 100px;
  position: relative;
  top: 200px;
  animation: body-enter 0.7s 0.2s 1 ease;
  animation-fill-mode: forwards;
  -webkit-animation: body-enter 0.7s 0.2s 1 ease;
  -webkit-animation-fill-mode: forwards;
  -webkit-transform: scale(0) translateZ(0);
  transform: scale(0) translateZ(0);
}

.head {
  width: 196px;
  height: 260px;
  border-radius: 50px;
  background: #FFE4BE;
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -210px;
  margin-left: -98px;
  animation: grow 0.7s 0.4s 1 ease, music-move 1s 3.3s infinite alternate ease-in-out;
  -webkit-animation: grow 0.7s 0.4s 1 ease, music-move 1s 3.3s infinite alternate ease-in-out;
  /*
    animation:grow 0.7s 0.4s 1 ease;
    -webkit-animation:grow 0.7s 0.4s 1 ease;
  */
  transform-origin: bottom;
  -webkit-transform-origin: bottom;
  -webkit-transform: scale(0) translateZ(0);
  transform: scale(0) translateZ(0);
  -webkit-animation-fill-mode: forwards;
  animation-fill-mode: forwards;
}

.hair-main {
  width: 220px;
  height: 0px;
  background: #E7AB57;
  border-radius: 54px 54px 0px 0px;
  margin-left: -12px;
  margin-top: -10px;
  animation: hair-anim 0.7s 0.9s 1 ease;
  animation-fill-mode: forwards;
  -webkit-animation: hair-anim 0.7s 0.9s 1 ease;
  -webkit-animation-fill-mode: forwards;
  position: relative;
  z-index: 2;
}

.hair-top {
  width: 128px;
  height: 70px;
  opacity: 0;
  border-top-right-radius: 30px;
  background: #E7AB57;
  position: relative;
  top: -17px;
  left: 50%;
  transform: translateX(-64px);
  -webkit-transform: translateX(-64px);
  transform-origin: right;
  -webkit-transform-origin: right;
  animation: hair-top-anim 0.7s 1s 1 ease;
  -webkit-animation: hair-top-anim 0.7s 1s 1 ease;
  animation-fill-mode: forwards;
  -webkit-animation-fill-mode: forwards;
}

.hair-bottom {
  width: 54px;
  height: 50px;
  opacity: 0;
  border-bottom-left-radius: 25px;
  background: #E7AB57;
  position: relative;
  top: -20px;
  left: 50%;
  transform: translateX(-27px);
  -webkit-transform: translateX(-27px);
  transform-origin: left;
  -webkit-transform-origin: left;
  animation: hair-bottom-anim 0.7s 1.4s 1 ease;
  -webkit-animation: hair-bottom-anim 0.7s 1.4s 1 ease;
  animation-fill-mode: forwards;
  -webkit-animation-fill-mode: forwards;
}

.sideburn {
  width: 8px;
  height: 25px;
  background: #E7AB57;
  position: absolute;
  bottom: -25px;
  opacity: 0;
  animation: sideburn-anim 0.7s 0.9s 1 ease;
  animation-fill-mode: forwards;
  -webkit-animation: sideburn-anim 0.7s 0.9s 1 ease;
  -webkit-animation-fill-mode: forwards;
}

.sideburn#left {
  left: 12px;
}

.sideburn#right {
  right: 12px;
}

.face {
  width: 180px;
  height: 0px;
  border-radius: 48px 48px 0 0;
  background: #FFE4BE;
  position: absolute;
  top: 40px;
  left: 8px;
  animation: hair-anim 0.1s 0.8s 1 linear;
  animation-fill-mode: forwards;
  -webkit-animation: hair-anim 0.1s 0.8s 1 linear;
  -webkit-animation-fill-mode: forwards;
  z-index: 3;
}

.nose {
  width: 20px;
  height: 45px;
  opacity: 1;
  background: #FFE4BE;
  border-top-left-radius: 20px;
  position: absolute;
  left: 50%;
  top: 80px;
  margin-left: -20px;
  animation: shadow-anim 0.7s 3s 1 ease;
  animation-fill-mode: forwards;
  -webkit-animation: shadow-anim 0.7s 3s 1 ease;
  -webkit-animation-fill-mode: forwards;
  z-index: 5;
}

.ear {
  width: 24px;
  height: 35px;
  background: #FFE4BE;
  border-radius: 12px;
  position: absolute;
  top: 116px;
  animation: grow 0.7s 1.3s 1 ease;
  animation-fill-mode: forwards;
  -webkit-animation: grow 0.7s 1.3s 1 ease;
  -webkit-animation-fill-mode: forwards;
  -webkit-transform: scale(0);
  transform: scale(0);
}

.mouth {
  width: 66px;
  height: 33px;
  border-radius: 0 0 33px 33px;
  background: white;
  position: absolute;
  top: 150px;
  left: 50%;
  margin-left: -33px;
  animation: grow 0.7s 2.6s 1 ease;
  animation-fill-mode: forwards;
  -webkit-animation: grow 0.7s 2.6s 1 ease;
  -webkit-animation-fill-mode: forwards;
  -webkit-transform: scale(0);
  transform: scale(0);
}

.ear#left {
  left: -12px;
}

.ear#right {
  right: -12px;
}

.eye-shadow {
  width: 30px;
  height: 15px;
  border-radius: 0 0 15px 15px;
  background: rgba(149, 36, 0, 0.1);
  position: absolute;
  top: 70px;
  animation: grow 0.7s 2s 1 ease;
  animation-fill-mode: forwards;
  -webkit-animation: grow 0.7s 2s 1 ease;
  -webkit-animation-fill-mode: forwards;
  -webkit-transform: scale(0);
  transform: scale(0);
}

.eye-shadow#left {
  left: 35px;
  z-index: 5;
}

.eye-shadow#right {
  right: 35px;
}

.eyebrow {
  width: 40px;
  height: 10px;
  background: #E7AB57;
  position: absolute;
  top: -35px;
  left: 50%;
  margin-left: -20px;
  opacity: 0;
  -webkit-backface-visibility: hidden;
}

.eye-shadow#left .eyebrow {
  animation: eyebrow-anim-left 0.7s 2.2s 1 ease;
  animation-fill-mode: forwards;
  -webkit-animation: eyebrow-anim-left 0.7s 2.2s 1 ease;
  -webkit-animation-fill-mode: forwards;
}

.eye-shadow#right .eyebrow {
  animation: eyebrow-anim-right 0.7s 2.2s 1 ease, eyebrow-raise 2s 6.6s infinite alternate ease-in-out;
  animation-fill-mode: forwards;
  -webkit-animation: eyebrow-anim-right 0.7s 2.2s 1 ease, eyebrow-raise 2s 6.6s infinite alternate ease-in-out;
  -webkit-animation-fill-mode: forwards;
}

.eye {
  width: 20px;
  height: 28px;
  border-radius: 10px;
  background: #334C68;
  position: absolute;
  top: -18px;
  left: 50%;
  margin-left: -10px;
  animation: grow 0.7s 2.2s 1 ease, eye-blink 4s 4.4s infinite linear;
  animation-fill-mode: forwards;
  -webkit-animation: grow 0.7s 2.2s 1 ease, eye-blink 4s 4.4s infinite linear;
  -webkit-animation-fill-mode: forwards;
  -webkit-transform: scale(0);
  transform: scale(0);
  -webkit-transform-origin: bottom;
  transform-origin: bottom;

}

.shadow-wrapper {
  width: 98px;
  height: 260px;
  position: absolute;
  left: -8px;
  bottom: -84px;
  z-index: 4;
  overflow: hidden;
}

.shadow {
  width: 98px;
  height: 260px;
  border-radius: 50px;
  background: rgba(149, 36, 0, 0.1);
  position: absolute;
  z-index: 4;
  opacity: 0;
  animation: shadow-anim 1s 2.8s 1 ease;
  animation-fill-mode: forwards;
  -webkit-animation: shadow-anim 1s 2.8s 1 ease;
  -webkit-animation-fill-mode: forwards;
}

.triangle-light {
  width: 400px;
  height: 600px;
  background: #FFFFFF;
  opacity: 0.2;
  position: absolute;
  right: -65%;
  animation: triangle-light-anim 1s 2.8s 1 ease;
  animation-fill-mode: forwards;
  -webkit-animation: triangle-light-anim 1s 2.8s 1 ease;
  -webkit-animation-fill-mode: forwards;
  -webkit-transform: translate(200px, 0px);
  transform: translate(200px, 0px);
}

.triangle-dark {
  width: 400px;
  height: 600px;
  background: #000000;
  opacity: 0.2;
  position: absolute;
  left: -60%;
  top: 30%;
  animation: triangle-dark-anim 1s 3s 1 ease;
  animation-fill-mode: forwards;
  -webkit-animation: triangle-dark-anim 1s 3s 1 ease;
  -webkit-animation-fill-mode: forwards;
  -webkit-transform: translate(-200px, 0px);
  transform: translate(-200px, 0px);
}

.music-note {
  position: absolute;
  font-size: 150px;
  color: #FCB040;
  width: 1px;
  left: 50%;
  opacity: 0;
}

.music-note#one {
  margin-left: -250px;
  top: 50%;
  animation: note-anim 2s 3.5s infinite ease;
  animation-fill-mode: forwards;
  -webkit-animation: note-anim 2s 3.5s infinite ease;
  -webkit-animation-fill-mode: forwards;
}

.music-note#two {
  margin-left: 150px;
  top: 30%;
  animation: note-anim 2s 4.3s infinite ease;
  animation-fill-mode: forwards;
  -webkit-animation: note-anim 2s 4.3s infinite ease;
  -webkit-animation-fill-mode: forwards;
}

.shirt-text {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  color: white;
  position: relative;
  top: -300px;
  font-size: 50px;
  display: inline-block;
  -webkit-text-stroke: 2px;
  -webkit-transform: translate(0px, 100px);
  transform: translate(0px, 100px);
  animation-fill-mode: forwards !important;
  -webkit-animation-fill-mode: forwards !important;
}

.shirt-text:nth-of-type(1) {
  animation: text-anim 0.7s 3s 1 ease;
  -webkit-animation: text-anim 0.7s 3s 1 ease;
}

.shirt-text:nth-of-type(2) {
  color: #EF4136;
  animation: text-anim 0.7s 3.1s 1 ease;
  -webkit-animation: text-anim 0.7s 3.1s 1 ease;
}

.shirt-text:nth-of-type(3) {
  animation: text-anim 0.7s 3.2s 1 ease;
  -webkit-animation: text-anim 0.7s 3.2s 1 ease;
}

.shirt-text:nth-of-type(4) {
  animation: text-anim 0.7s 3.3s 1 ease;
  -webkit-animation: text-anim 0.7s 3.3s 1 ease;
}

.shirt-text:nth-of-type(5) {
  animation: text-anim 0.7s 3.4s 1 ease;
  -webkit-animation: text-anim 0.7s 3.4s 1 ease;
}

@keyframes grow {
  0% {
    position: absolute;
    -webkit-transform: scale(0) translateZ(0);
    transform: scale(0) translateZ(0);
  }
  60% {
    -webkit-transform: scale(1.15) translateZ(0);
    transform: scale(1.15) translateZ(0);
  }
  80% {
    -webkit-transform: scale(0.95) translateZ(0);
    transform: scale(0.95) translateZ(0);
  }
  100% {
    -webkit-transform: scale(1) translateZ(0);
    transform: scale(1) translateZ(0);
  }
}

@-webkit-keyframes grow /* Safari and Chrome */
{
  0% {
    position: absolute;
    -webkit-transform: scale(0) translateZ(0);
    transform: scale(0) translateZ(0);
  }
  60% {
    -webkit-transform: scale(1.15) translateZ(0);
    transform: scale(1.15) translateZ(0);
  }
  80% {
    -webkit-transform: scale(0.95) translateZ(0);
    transform: scale(0.95) translateZ(0);
  }
  100% {
    -webkit-transform: scale(1) translateZ(0);
    transform: scale(1) translateZ(0);
  }
}

@keyframes body-enter {
  0% {
    -webkit-transform: translateY(200px) translateZ(0);
    transform: translateY(200px) translateZ(0);
  }
  60% {
    -webkit-transform: translateY(-20px) translateZ(0);
    transform: translateY(-20px) translateZ(0);
  }
  80% {
    -webkit-transform: translateY(30px) translateZ(0);
    transform: translateY(30px) translateZ(0);
  }
  100% {
    -webkit-transform: translateY(0px) translateZ(0);
    transform: translateY(0px) translateZ(0);
  }
}

@-webkit-keyframes body-enter /* Safari and Chrome */
{
  0% {
    -webkit-transform: translateY(200px) translateZ(0);
    transform: translateY(200px) translateZ(0);
  }
  60% {
    -webkit-transform: translateY(-20px) translateZ(0);
    transform: translateY(-20px) translateZ(0);
  }
  80% {
    -webkit-transform: translateY(30px) translateZ(0);
    transform: translateY(30px) translateZ(0);
  }
  100% {
    -webkit-transform: translateY(0px) translateZ(0);
    transform: translateY(0px) translateZ(0);
  }
}

@keyframes hair-anim {
  0% {
    height: 0px;
    -webkit-transform: translateY(137px) translateZ(0);
    transform: translateY(137px) translateZ(0);
  }
  100% {
    height: 137px;
    -webkit-transform: translateY(0px) translateZ(0);
    transform: translateY(0px) translateZ(0);
  }
}

@-webkit-keyframes hair-anim /* Safari and Chrome */
{
  0% {
    height: 0px;
    -webkit-transform: translateY(137px) translateZ(0);
    transform: translateY(137px) translateZ(0);
  }
  100% {
    height: 137px;
    -webkit-transform: translateY(0px) translateZ(0);
    transform: translateY(0px) translateZ(0);
  }
}

@keyframes sideburn-anim {
  0% {
    opacity: 0;
    -webkit-transform: translateY(-25px) translateZ(0);
    transform: translateY(-25px) translateZ(0);
  }
  100% {
    opacity: 1;
    -webkit-transform: translateY(0px) translateZ(0);
    transform: translateY(0px) translateZ(0);
  }
}

@-webkit-keyframes sideburn-anim /* Safari and Chrome */
{
  0% {
    opacity: 0;
    -webkit-transform: translateY(-25px) translateZ(0);
    transform: translateY(-25px) translateZ(0);
  }
  100% {
    opacity: 1;
    -webkit-transform: translateY(0px) translateZ(0);
    transform: translateY(0px) translateZ(0);
  }
}

@keyframes hair-top-anim {
  0% {
    opacity: 0;
    -webkit-transform: translate(-64px, 30px) translateZ(0);
    transform: translate(-64px, 30px) translateZ(0);
  }
  60% {
    opacity: 1;
    -webkit-transform: rotate(0deg) translate(-64px, 30px) translateZ(0);
    transform: rotate(0deg) translate(-64px, 30px) translateZ(0);
  }
  80% {
    opacity: 1;
    -webkit-transform: rotate(10deg) translate(-64px, -5px) translateZ(0);
    transform: rotate(10deg) translate(-64px, -5px) translateZ(0);
  }
  100% {
    opacity: 1;
    -webkit-transform: rotate(0deg) translate(-64px, 0px) translateZ(0);
    transform: rotate(0deg) translate(-64px, 0px) translateZ(0);
  }
}

@-webkit-keyframes hair-top-anim /* Safari and Chrome */
{
  0% {
    opacity: 0;
    -webkit-transform: translate(-64px, 30px) translateZ(0);
    transform: translate(-64px, 30px) translateZ(0);
  }
  60% {
    opacity: 1;
    -webkit-transform: rotate(0deg) translate(-64px, 30px) translateZ(0);
    transform: rotate(0deg) translate(-64px, 30px) translateZ(0);
  }
  80% {
    opacity: 1;
    -webkit-transform: rotate(10deg) translate(-64px, -5px) translateZ(0);
    transform: rotate(10deg) translate(-64px, -5px) translateZ(0);
  }
  100% {
    opacity: 1;
    -webkit-transform: rotate(0deg) translate(-64px, 0px) translateZ(0);
    transform: rotate(0deg) translate(-64px, 0px) translateZ(0);
  }
}

@keyframes hair-bottom-anim {
  0% {
    opacity: 0;
    -webkit-transform: translate(-27px, -40px) translateZ(0);
    transform: translate(-27px, -40px) translateZ(0);
  }
  60% {
    opacity: 1;
    -webkit-transform: rotate(0deg) translate(-27px, -40px) translateZ(0);
    transform: rotate(0deg) translate(-27px, -40px) translateZ(0);
  }
  80% {
    opacity: 1;
    -webkit-transform: rotate(10deg) translate(-27px, 5px) translateZ(0);
    transform: rotate(10deg) translate(-27px, 5px) translateZ(0);
  }
  100% {
    opacity: 1;
    -webkit-transform: rotate(0deg) translate(-27px, 0px) translateZ(0);
    transform: rotate(0deg) translate(-27px, 0px) translateZ(0);
  }
}

@-webkit-keyframes hair-bottom-anim /* Safari and Chrome */
{
  0% {
    opacity: 0;
    -webkit-transform: translate(-27px, -40px) translateZ(0);
    transform: translate(-27px, -40px) translateZ(0);
  }
  60% {
    opacity: 1;
    -webkit-transform: rotate(0deg) translate(-27px, -40px) translateZ(0);
    transform: rotate(0deg) translate(-27px, -40px) translateZ(0);
  }
  80% {
    opacity: 1;
    -webkit-transform: rotate(10deg) translate(-27px, 5px) translateZ(0);
    transform: rotate(10deg) translate(-27px, 5px) translateZ(0);
  }
  100% {
    opacity: 1;
    -webkit-transform: rotate(0deg) translate(-27px, 0px) translateZ(0);
    transform: rotate(0deg) translate(-27px, 0px) translateZ(0);
  }
}

@keyframes music-move {
  0% {
    -webkit-transform: rotate(0deg) translateZ(0);
    transform: rotate(0deg) translateZ(0);
  }
  33% {
    -webkit-transform: rotate(-5deg) translateZ(0);
    transform: rotate(-5deg) translateZ(0);
  }
  66% {
    -webkit-transform: rotate(5deg) translateZ(0);
    transform: rotate(5deg) translateZ(0);
  }
  100% {
    -webkit-transform: rotate(0deg) translateZ(0);
    transform: rotate(0deg) translateZ(0);
  }
}

@-webkit-keyframes music-move /* Safari and Chrome */
{
  0% {
    -webkit-transform: rotate(0deg) translateZ(0);
    transform: rotate(0deg) translateZ(0);
  }
  33% {
    -webkit-transform: rotate(-5deg) translateZ(0);
    transform: rotate(-5deg) translateZ(0);
  }
  66% {
    -webkit-transform: rotate(5deg) translateZ(0);
    transform: rotate(5deg) translateZ(0);
  }
  100% {
    -webkit-transform: rotate(0deg) translateZ(0);
    transform: rotate(0deg) translateZ(0);
  }
}

@keyframes eyebrow-anim-right {
  0% {
    opacity: 0;
    -webkit-transform: translateY(-25px) translateZ(0);
    transform: translateY(-25px) translateZ(0);
  }
  70% {
    opacity: 1;
    -webkit-transform: translateY(5px) translateZ(0);
    transform: translateY(5px) translateZ(0);
  }
  100% {
    opacity: 1;
    -webkit-transform: rotate(9deg) translateY(0px) translateZ(0);
    transform: rotate(9deg) translateY(0px) translateZ(0);
  }
}

@-webkit-keyframes eyebrow-anim-right /* Safari and Chrome */
{
  0% {
    opacity: 0;
    -webkit-transform: translateY(-25px) translateZ(0);
    transform: translateY(-25px) translateZ(0);
  }
  70% {
    opacity: 1;
    -webkit-transform: translateY(5px) translateZ(0);
    transform: translateY(5px) translateZ(0);
  }
  100% {
    opacity: 1;
    -webkit-transform: rotate(9deg) translateY(0px) translateZ(0);
    transform: rotate(9deg) translateY(0px) translateZ(0);
  }
}

@keyframes eyebrow-raise {
  0% {
    top: -35px;
  }
  80% {
    top: -35px;

  }
  100% {
    top: -45px;
  }
}

@-webkit-keyframes eyebrow-raise /* Safari and Chrome */
{
  0% {
    top: -35px;
  }
  80% {
    top: -35px;

  }
  100% {
    top: -45px;
  }
}

@keyframes eyebrow-anim-left {
  0% {
    opacity: 0;
    -webkit-transform: translateY(-25px) translateZ(0);
    transform: translateY(-25px) translateZ(0);
  }
  70% {
    opacity: 1;
    -webkit-transform: translateY(5px) translateZ(0);
    transform: translateY(5px);
  }
  100% {
    opacity: 1;
    -webkit-transform: translateY(0px) translateZ(0);
    transform: translateY(0px) translateZ(0);
  }
}

@-webkit-keyframes eyebrow-anim-left /* Safari and Chrome */
{
  0% {
    opacity: 0;
    -webkit-transform: translateY(-25px) translateZ(0);
    transform: translateY(-25px) translateZ(0);
  }
  70% {
    opacity: 1;
    -webkit-transform: translateY(5px) translateZ(0);
    transform: translateY(5px) translateZ(0);
  }
  100% {
    opacity: 1;
    -webkit-transform: translateY(0px) translateZ(0);
    transform: translateY(0px) translateZ(0);
  }
}

@keyframes border-pulse {
  0% {
    -webkit-transform: scale(0) translateZ(0);
    transform: scale(0) translateZ(0);
    border-width: 20px;
  }
  40% {
    -webkit-transform: scale(1) translateZ(0);
    transform: scale(1) translateZ(0);
    border-width: 20px;
    margin-left: -220px;
    margin-top: -220px;
  }
  100% {
    -webkit-transform: scale(1.5) translateZ(0);
    transform: scale(1.5) translateZ(0);
    border-width: 0px;
    border-style: double;
    margin-left: -200px;
    margin-top: -200px;
  }
}

@-webkit-keyframes border-pulse /* Safari and Chrome */
{
  0% {
    -webkit-transform: scale(0) translateZ(0);
    transform: scale(0) translateZ(0);
    border-width: 20px;
  }
  40% {
    -webkit-transform: scale(1) translateZ(0);
    transform: scale(1) translateZ(0);
    border-width: 20px;
    margin-left: -220px;
    margin-top: -220px;
  }
  100% {
    -webkit-transform: scale(1.5) translateZ(0);
    transform: scale(1.5) translateZ(0);
    border-width: 0px;
    border-style: double;
    margin-left: -200px;
    margin-top: -200px;
  }
}

@keyframes shadow-anim {
  0% {
    opacity: 0;
    -webkit-transform: translate(98px, 0px) translateZ(0);
    transform: translate(98px, 0px) translateZ(0);
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
    -webkit-transform: translate(0px, 0px) translateZ(0);
    transform: translate(0px, 0px) translateZ(0);
  }
}

@-webkit-keyframes shadow-anim /* Safari and Chrome */
{
  0% {
    opacity: 0;
    -webkit-transform: translate(98px, 0px) translateZ(0);
    transform: translate(98px, 0px) translateZ(0);
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
    -webkit-transform: translate(0px, 0px) translateZ(0);
    transform: translate(0px, 0px) translateZ(0);
  }
}

@keyframes triangle-light-anim {
  0% {
    -webkit-transform: translate(200px, 0px) translateZ(0);
    transform: translate(200px, 0px) translateZ(0);
  }
  100% {
    -webkit-transform: rotate(45deg) translate(0px, 0px) translateZ(0);
    transform: rotate(45deg) translate(0px, 0px) translateZ(0);
  }
}

@-webkit-keyframes triangle-light-anim /* Safari and Chrome */
{
  0% {
    -webkit-transform: translate(200px, 0px) translateZ(0);
    transform: translate(200px, 0px) translateZ(0);
  }
  100% {
    -webkit-transform: rotate(45deg) translate(0px, 0px) translateZ(0);
    transform: rotate(45deg) translate(0px, 0px) translateZ(0);
  }
}

@keyframes triangle-dark-anim {
  0% {
    -webkit-transform: translate(-200px, 0px) translateZ(0);
    transform: translate(-200px, 0px) translateZ(0);
  }
  100% {
    -webkit-transform: rotate(-45deg) translate(0px, 0px) translateZ(0);
    transform: rotate(-45deg) translate(0px, 0px) translateZ(0);
  }
}

@-webkit-keyframes triangle-dark-anim /* Safari and Chrome */
{
  0% {
    -webkit-transform: translate(-200px, 0px) translateZ(0);
    transform: translate(-200px, 0px) translateZ(0);
  }
  100% {
    -webkit-transform: rotate(-45deg) translate(0px, 0px) translateZ(0);
    transform: rotate(-45deg) translate(0px, 0px) translateZ(0);
  }
}

@keyframes note-anim {
  0% {
    opacity: 0;
    -webkit-transform: translate(0px, 50px) translateZ(0);
    transform: translate(0px, 50px) translateZ(0);
  }
  30% {
    -webkit-transform: rotate(12deg) translate(-30px, 0px) translateZ(0);
    transform: rotate(12deg) translate(-30px, 0px) translateZ(0);
  }
  45% {
    opacity: 1;
  }
  60% {
    -webkit-transform: rotate(-12deg) translate(30px, -100px) translateZ(0);
    transform: rotate(-12deg) translate(30px, -100px) translateZ(0);
  }
  100% {
    opacity: 0;
    -webkit-transform: rotate(0deg) translate(0px, -200px) translateZ(0);
    transform: rotate(0deg) translate(0px, -200px) translateZ(0);
  }
}

@-webkit-keyframes note-anim /* Safari and Chrome */
{
  0% {
    opacity: 0;
    -webkit-transform: translate(0px, 50px) translateZ(0);
    transform: translate(0px, 50px) translateZ(0);
  }
  30% {
    -webkit-transform: rotate(12deg) translate(-30px, 0px) translateZ(0);
    transform: rotate(12deg) translate(-30px, 0px) translateZ(0);
  }
  45% {
    opacity: 1;
  }
  60% {
    -webkit-transform: rotate(-12deg) translate(30px, -100px) translateZ(0);
    transform: rotate(-12deg) translate(30px, -100px) translateZ(0);
  }
  100% {
    opacity: 0;
    -webkit-transform: rotate(0deg) translate(0px, -200px) translateZ(0);
    transform: rotate(0deg) translate(0px, -200px) translateZ(0);
  }
}

@keyframes text-anim {
  0% {
    -webkit-transform: translate(0px, 100px) translateZ(0);
    transform: translate(0px, 100px) translateZ(0);
  }
  60% {
    -webkit-transform: translate(0px, -20px) translateZ(0);
    transform: translate(0px, -20px) translateZ(0);
  }
  80% {
    -webkit-transform: translate(0px, 15px) translateZ(0);
    transform: translate(0px, 15px) translateZ(0);
  }
  100% {
    -webkit-transform: translate(0px, 0px) translateZ(0);
    transform: translate(0px, 0px) translateZ(0);
  }
}

@-webkit-keyframes text-anim /* Safari and Chrome */
{
  0% {
    -webkit-transform: translate(0px, 100px) translateZ(0);
    transform: translate(0px, 100px) translateZ(0);
  }
  60% {
    -webkit-transform: translate(0px, -20px) translateZ(0);
    transform: translate(0px, -20px) translateZ(0);
  }
  80% {
    -webkit-transform: translate(0px, 15px) translateZ(0);
    transform: translate(0px, 15px) translateZ(0);
  }
  100% {
    -webkit-transform: translate(0px, 0px) translateZ(0);
    transform: translate(0px, 0px) translateZ(0);
  }
}

@keyframes eye-blink {
  0% {
    -webkit-transform: scaleY(1) translateY(0px) translateZ(0);
    transform: scaleY(1) translateY(0px) translateZ(0);
  }
  45% {
    -webkit-transform: scaleY(1) translateY(0px) translateZ(0);
    transform: scaleY(1) translateY(0px) translateZ(0);
  }
  50% {
    -webkit-transform: scaleY(0.1) translateZ(0);
    transform: scaleY(0.1) translateZ(0);
  }
  55% {
    -webkit-transform: scaleY(1) translateY(0px);
    transform: scaleY(1) translateY(0px);
  }
  100% {
    -webkit-transform: scaleY(1) translateY(0px) translateZ(0);
    transform: scaleY(1) translateY(0px) translateZ(0);
  }
}

@-webkit-keyframes eye-blink /* Safari and Chrome */
{
  0% {
    -webkit-transform: scaleY(1) translateY(0px) translateZ(0);
    transform: scaleY(1) translateY(0px) translateZ(0);
  }
  45% {
    -webkit-transform: scaleY(1) translateY(0px) translateZ(0);
    transform: scaleY(1) translateY(0px) translateZ(0);
  }
  50% {
    -webkit-transform: scaleY(0.1) translateZ(0);
    transform: scaleY(0.1) translateZ(0);
  }
  55% {
    -webkit-transform: scaleY(1) translateY(0px) translateZ(0);
    transform: scaleY(1) translateY(0px) translateZ(0);
  }
  100% {
    -webkit-transform: scaleY(1) translateY(0px) translateZ(0);
    transform: scaleY(1) translateY(0px) translateZ(0);
  }
}
</style>
