<template>
  <ion-page v-if="currentChannel">
    <ion-header :translucent="true">
      <ion-back-button color="primary" :text=null default-href="/" style="left: 5px; position: absolute;"/>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-grid>
        <ion-row style="height: 100vh">
          <ion-col :size="currentUser.name==='ryanyen2'?6:8" style="height: 100vh">
            <div ref="twitchVideo"></div>
          </ion-col>
          <ion-col v-if="currentUser.name==='ryanyen2'" size="2">
            <h5>Filters</h5>
            <ion-item>
              <ion-label position="stacked">Ex-Emote</ion-label>
              <ion-input type="number" v-model="filters.exEmotesFilter"/>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Ex-Caps</ion-label>
              <ion-input type="number" v-model="filters.exCapsFilter"/>
            </ion-item>
            <ion-item>
              <ion-label>Profanity</ion-label>
              <input type="checkbox" v-model="filters.profanityFilter"/>
            </ion-item>
            <ion-item>
              <ion-label>Re-Char</ion-label>
              <input type="checkbox" v-model="filters.repeatedCharacterFilter"/>
            </ion-item>
            <ion-item>
              <ion-label>Re-Words</ion-label>
              <input type="checkbox" v-model="filters.repeatedWordsFilter"/>
            </ion-item>

            <h5>Thresh / Loop</h5>
            <ion-item>
              <ion-label position="stacked">Norm</ion-label>
              <ion-input type="number" v-model="loopNormThresh"/>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Troll</ion-label>
              <ion-input type="number" v-model="loopTrollThresh"/>
            </ion-item>

            <h5>Announcement</h5>
            <ion-item>
              <ion-label>Type</ion-label>
              <ion-select v-model="announceInfo.type" interface="popover">
                <ion-select-option value="ATTENTION">Attention</ion-select-option>
                <ion-select-option value="ANNOUNCE">Announcement</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Announce Content</ion-label>
              <ion-input type="text" v-model="announceInfo.content"/>
            </ion-item>

            <ion-button @click="sendAnnouncement">Send Announcement</ion-button>
            <ion-button @click.end="filtersChangedHandler" expand="block" fill="outline">Submit</ion-button>
          </ion-col>

          <ion-col size="4">
            <ion-row style="height: 100vh">
              <ion-col size="12" v-if="currentChannel.withStory==='true'">
                <div>
                  <video
                      style="object-fit: fill; width:100%"
                      :loop="loopStories.includes(currentStoryPlot)"
                      autoplay
                      muted
                      :src="getVideoUrl(currentStoryPlot)"
                  >
                  </video>
                  <!--                  <img :src="getVideoUrl(currentStoryImg)" :alt="`currentImg-${currentStoryImg}`">-->
                </div>
              </ion-col>
              <ion-col size="12">
                <DynamicScroller
                    id="container"
                    :style="currentChannel.withStory==='true'? 'height: 54vh' : 'height: 88vh'"
                    :items="messages"
                    key-field="id"
                    :min-item-size="52"
                >
                  <template v-slot="{ item, index, active }">
                    <DynamicScrollerItem
                        :item="item"
                        :active="active"
                        :size-dependencies="[item.message,]"
                        :data-index="index"
                    >
                      <div class="text" v-html="item.message"></div>
                    </DynamicScrollerItem>
                  </template>
                  <!--                  <template v-slot="{ item }">-->
                  <!--                    <ion-item style="align-items: baseline">-->
                  <!--                      <ion-label>-->
                  <!--                        <span v-html="item.message"></span>-->
                  <!--                      </ion-label>-->
                  <!--                    </ion-item>-->
                  <!--                  </template>-->
                </DynamicScroller>
              </ion-col>
              <ion-col size="12">
                <ion-item>
                  <ion-input
                      @keyup.enter="sendMessage"
                      clear-input
                      type="text"
                      placeholder="Send a message"
                      v-model="message"
                  ></ion-input>
                  <ion-button shape="round" size="small" fill="clear" color="medium">
                    <ion-icon slot="icon-only" :icon="happyOutline"></ion-icon>
                  </ion-button>
                  <ion-button
                      shape="round"
                      size="small"
                      fill="clear"
                      @click.end="sendMessage"
                  >
                    <ion-icon slot="icon-only" :icon="sendOutline"></ion-icon>
                  </ion-button>
                </ion-item>
              </ion-col>
            </ion-row>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  // IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonGrid,
  IonRow,
  IonCol,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonItem,
  IonIcon,
  alertController,
  IonButton,
  IonBackButton,
  IonLabel
} from "@ionic/vue";
import {happyOutline, sendOutline} from "ionicons/icons";
import {DynamicScroller, DynamicScrollerItem} from 'vue-virtual-scroller'

import {StaticAuthProvider} from "@twurple/auth";
import {ChatClient} from "@twurple/chat";
import {ApiClient} from '@twurple/api';
import {useStore} from "@/store";

import {chatFilter} from '@/utils/chat-filter.ts'
import {db} from '@/utils/firebase.ts';
import {ref, push, update, onChildAdded, onChildChanged} from 'firebase/database';

import {loadScript} from "vue-plugin-load-script";

let timeInterval;
let chatRef;

export default {
  name: "Folder",
  components: {
    // IonButtons,
    IonContent,
    IonHeader,
    IonPage,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonBackButton,
    DynamicScroller,
    DynamicScrollerItem,
    IonItem,
    IonLabel
  },
  data() {
    return {
      message: "",
      messages: [],
      chatClient: null,
      currentChannel: null,
      followAgeListener: null,
      accessToken: "",
      currentUser: {},
      isAdmin: false,

      // announcement
      announceInfo: {
        type: "",
        content: '',
      },
      attentionCheckAnswer: "",


      emotesList: [],

      currentChannelMeta: {
        attentionChecked: 0,
        allMessagesCount: 0,
        allMessagesList: [],

        normMessagesCount: 0,
        trollingMessagesCount: 0,
        sentMessagesCount: 0,
        sentTrollingMessagesCount: 0,
      },

      // filter function
      filters: {
        profanityFilter: true,
        exEmotesFilter: 5,
        exCapsFilter: 0.9,
        repeatedCharacterFilter: true,
        repeatedWordsFilter: true,
        largeTextFilter: 300
      },

      containProfanity: false,
      containExEmotes: false,
      containExCaps: false,
      containRepeatedWords: false,
      containLargeText: false,
      containRepeatedCharacter: false,

      // twitch video
      videoPlayer: null,

      // images animation
      currentStoryPlot: 0,
      loopStories: [1, 2, 4],
      oneTimeStories: [0, 3, 5],

      storyLoop: 0,
      currentTrollInLoop: 0,
      trollLoopCount: 0,
      loopTrollThresh: 3,

      currentNormInLoop: 0,
      normLoopCount: 0,
      loopNormThresh: 10,
    };
  },
  methods: {
    async filtersChangedHandler() {
      await update(ref(db, `trials/trial${this.currentChannel.trialId}/configurations`), {
        ...this.filters,
        loopTrollThresh: this.loopTrollThresh,
        loopNormThresh: this.loopNormThresh
      })
    },
    async sendMessage() {
      if (this.message.length > 0) {
        // this.chatClient.say(this.currentChannel.userName, this.message);
        await push(ref(db, `trials/trial${this.currentChannel.trialId}/chats`), {
          id: this.uuidv4(),
          user: this.currentUser.displayName,
          message: `<p style="white-space: break-spaces"><span style="color: #ff9900">${this.currentUser.displayName}: </span>${this.message}</p>`
        })
      }
    },
    async sendAnnouncement() {
      if (this.announceInfo.content.length) {
        await push(ref(db, `trials/trial${this.currentChannel.trialId}/announcements`), {
          id: this.uuidv4(),
          user: this.currentUser.displayName,
          type: this.announceInfo.type,
          content: this.announceInfo.content,
        })
      }
    },
    async presentAnnouncement(content) {
      const alert = await alertController.create({
        cssClass: 'my-custom-class',
        header: 'ANNOUNCEMENT!',
        message: `<strong>${content}</strong>!!!`,
        buttons: [
          {
            text: 'Okay',
          },
        ],
      });

      return alert.present();
    },
    async presentAttentionPrompt(content) {
      const alert = await alertController.create({
        cssClass: 'my-custom-class',
        header: content,
        inputs: [
          {
            placeholder: 'Answer the question',
            id: 'answer-id',
            value: this.attentionCheckAnswer,
          },
        ],
        buttons: [
          {
            text: 'Confirm',
            handler: async () => {
              this.currentChannelMeta.attentionChecked += 1
              await update(ref(db, `trials/trial${this.currentChannel.trialId}/connectedUsers/${this.currentUser.name}/connectActivities/${this.currentChannel.dbKey}`), {
                attentionChecked: this.currentChannelMeta.attentionChecked
              })
            },
          },
        ],
      });
      return alert.present();
    },
    uuidv4() {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    },
    getVideoUrl(num) {
      const images = require.context('../static/images/', false, /\.webm$/)
      return images('./' + num + ".webm")
    },
    async updateMessageRecords(isAdmin, isMe, message, isTroll, trollType = null, thresh = null) {
      this.currentChannelMeta.allMessagesCount += 1
      this.currentChannelMeta.allMessagesList.push({
        isAdmin: isAdmin,
        isSentByMe: isMe,
        isTroll: isTroll,
        trollType: trollType,
        threshold: thresh,
        chatMessage: message,
        receivedTime: new Date().getTime(),
      })

      if (isTroll && isMe) this.currentChannelMeta.sentTrollingMessagesCount += 1
      else if (isTroll) {
        this.currentChannelMeta.trollingMessagesCount += 1
        this.currentTrollInLoop += 1
      } else if (isMe) this.currentChannelMeta.sentMessagesCount += 1
      else {
        this.currentChannelMeta.normMessagesCount += 1
        this.currentNormInLoop += 1
      }

      if (this.loopStories.includes(this.currentStoryPlot)) await this.changeStoryPlot(isTroll, trollType)

      if (this.currentUser.name === 'ryanyen2') {
        await update(ref(db, `trials/trial${this.currentChannel.trialId}/connectedUsers/${this.currentUser.name}/connectActivities/${this.currentChannel.dbKey}`), {
          ...this.currentChannelMeta
        })
      }
    },
    async changeStoryPlot(isTroll, trollType) {
      if (isTroll && this.currentStoryPlot === 2) {
        console.log('Troll2', this.currentTrollInLoop, this.currentNormInLoop)
        if (trollType === 'profanity' || this.currentTrollInLoop > this.loopTrollThresh) {
          this.currentNormInLoop = 0
          this.currentTrollInLoop = 0
          this.currentStoryPlot += 1
          this.trollLoopCount += 1
        } else if (((this.currentNormInLoop / 2) - this.currentTrollInLoop) > this.loopNormThresh) {
          this.currentNormInLoop = 0
          this.currentTrollInLoop = 0
          this.currentStoryPlot = 1
        }
      }
      else if (
          isTroll &&
          this.currentStoryPlot === 1 &&
          (trollType === 'profanity' || (this.currentTrollInLoop - (this.currentNormInLoop/10))> this.loopTrollThresh)
      ) {
        console.log('Troll1', this.currentTrollInLoop, this.currentNormInLoop)
        this.currentNormInLoop = 0
        this.currentTrollInLoop = 0
        this.currentStoryPlot += 1
        this.trollLoopCount += 1
      } else if (
          !isTroll &&
          this.currentStoryPlot === 4 &&
          ((this.currentNormInLoop / 2) - this.currentTrollInLoop) > this.loopNormThresh
      ) {
        console.log('Norm', this.currentTrollInLoop, this.currentNormInLoop)
        this.currentStoryPlot = 5
        this.currentNormInLoop = 0
        this.currentTrollInLoop = 0
        this.normLoopCount += 1
      }
      // console.log(this.currentStoryPlot, this.currentTrollInLoop, this.currentNormInLoop)

      if (this.currentUser.name === 'ryanyen2') {
        await update(ref(db, `trials/trial${this.currentChannel.trialId}/connectedUsers/${this.currentUser.name}/story`), {
          storyLoop: this.storyLoop,
          trollLoopCount: this.trollLoopCount,
          normLoopCount: this.normLoopCount
        })
      }
    },
    async storeConnectionRecord() {
      await push(ref(db, `trials/trial${this.currentChannel.trialId}/connectedUsers/${this.currentUser.name}/connectActivities`), {
        connectTime: new Date().getTime(),
        localeConnectTime: new Date().toLocaleString().replace(',', ''),
        streamId: this.currentChannel.id,
        gameId: this.currentChannel.gameId,
        // title: this.currentChannel.title,
        streamerDisplayName: this.currentChannel.userDisplayName,
        streamerId: this.currentChannel.userId,
        streamerUserName: this.currentChannel.userName,
        // currentViewers: this.currentChannel.viewers,
        ...this.currentChannelMeta,
      }).then(res => this.currentChannel = {...this.currentChannel, dbKey: res.key})
    }
  },
  setup() {
    return {
      sendOutline,
      happyOutline,
      clientId: process.env.VUE_APP_CLIENT_ID,
    };
  },
  async mounted() {
    const store = useStore();
    this.accessToken = store.state.token
    this.currentUser = store.state.currentUser
    if (this.currentUser.name === process.env.VUE_APP_ADMIN_NAME) this.isAdmin = true

    this.currentChannel = this.$route.params
    console.log('Channel', this.currentChannel)
    // window.open(`https://www.twitch.tv/${this.currentChannel.userName}`, '_blank').focus()

    await this.storeConnectionRecord();

    const authProvider = new StaticAuthProvider(
        this.clientId,
        this.accessToken
    );
    const apiClient = new ApiClient({authProvider})

    const channelEmotesList = await apiClient.chat.getChannelEmotes(this.currentChannel.userId)
    const globalEmotesList = await apiClient.chat.getGlobalEmotes()
    this.emotesList = channelEmotesList.concat(globalEmotesList)

    this.chatClient = new ChatClient({authProvider, channels: [this.currentChannel.userName]});
    await this.chatClient.connect();

    let c = '#000000'
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) c = '#ffffff'

    this.followAgeListener = this.chatClient.onMessage(
        async (channel, user, message, msg) => {
          this.containExEmotes = false
          this.containProfanity = false
          this.containExCaps = false
          this.containLargeText = false
          this.containRepeatedWords = false

          const {
            repeatedWordsFilter,
            profanityFilter,
            exEmotesFilter,
            exCapsFilter,
            largeTextFilter
          } = {...this.filters}
          if (profanityFilter) this.containProfanity = chatFilter.existsProfanity(message)

          if (exEmotesFilter > 0) {
            let emoteCount = 0
            this.emotesList.map(emote => {
              const idx = message.indexOf(emote.name)
              if (!this.containExEmotes && idx !== -1 && emote.name !== ':/') {
                emoteCount += 1
                const emoteUrl = emote.getImageUrl(1)
                if (emoteCount < exEmotesFilter) {
                  message = message.replace(emote.name, `<img src="${emoteUrl}" alt="emote_${emote.id}" />`)
                } else this.containExEmotes = true
              }
            })
          }

          if (repeatedWordsFilter) this.containRepeatedWords = chatFilter.findDuplicateWords(message)
          // if (repeatedCharacterFilter) this.containRepeatedCharacter = chatFilter.existRepeatedCharacter(message)
          if (largeTextFilter > 0) this.containLargeText = message.length >= largeTextFilter
          if (exCapsFilter > 0) this.containExCaps = ((message.length - message.replace(/[A-Z]/g, '').length) / message.length) >= exCapsFilter

          let isTrollMsg = true
          const sentByMe = this.currentUser.displayName === user
          const isSentByAdmin = this.currentUser.displayName === user
          if (this.containProfanity) await this.updateMessageRecords(isSentByAdmin, sentByMe, message, true, 'profanity', null)
          else if (this.containRepeatedWords) await this.updateMessageRecords(isSentByAdmin, sentByMe, message, true, 'repWords', null)
          else if (this.containExEmotes) await this.updateMessageRecords(isSentByAdmin, sentByMe, message, true, 'exEmotes', exEmotesFilter)
          else if (this.containExCaps) await this.updateMessageRecords(isSentByAdmin, sentByMe, message, true, 'exCaps', exCapsFilter)
          // else if (this.containRepeatedCharacter) await this.updateMessageRecords(isSentByAdmin, sentByMe, message, true, 'repChar', null)
          else if (this.containLargeText) await this.updateMessageRecords(isSentByAdmin, sentByMe, message, true, 'largeText', largeTextFilter)
          else {
            isTrollMsg = false
            await this.updateMessageRecords(isSentByAdmin, sentByMe, message, false)
          }

          const colorMsg = msg.userInfo.color ? msg.userInfo.color : '#9147FF';
          const trollMsgColor = isTrollMsg ? 'rgba(134,134,134,0.5)' : c
          this.messages.push({
            id: msg.id,
            user: user,
            message: `<p style="white-space: break-spaces; color: ${trollMsgColor}"><span style="color: ${colorMsg}">${user}: </span>${message}</p>`,
          });
          if (this.messages.length >= 50) this.messages.shift()

          const container = this.$el.querySelector("#container");
          container.scrollTop = container.scrollHeight;
        }
    );
    loadScript('https://player.twitch.tv/js/embed/v1.js').then(() => {
      const options = {
        width: '100%',
        height: window.innerHeight,
        channel: this.currentChannel.userName,
        allowfullscreen: false
      }

      this.videoPlayer = new window.Twitch.Player(this.$refs.twitchVideo, options);
      this.videoPlayer.addEventListener('ready', () => {
        this.videoPlayer.setQuality(1080);
        this.videoPlayer.setVolume(0.5);
      });
    })

    onChildAdded(ref(db, `trials/trial${this.currentChannel.trialId}/announcements`), async (data) => {
      const {type, content} = data.val()
      if (type === 'ATTENTION' && this.currentUser.name !== 'ryanyen2') {
        await this.presentAttentionPrompt(content)
      } else if (type === 'ANNOUNCE' && this.currentUser.name !== 'ryanyen2') {
        await this.presentAnnouncement(content)
      }
    })

    chatRef = ref(db, `trials/trial${this.currentChannel.trialId}/chats`)
    onChildAdded(chatRef, (data) => {
      const {id, user, message} = data.val()
      this.messages.push({
        id: id,
        user: user,
        message: message,
      });
      if (this.messages.length >= 50) this.messages.shift()
      this.message = "";
    });

    const configureRef = ref(db, `trials/trial${this.currentChannel.trialId}/configurations`)
    await update(configureRef, {
      ...this.filters,
      loopTrollThresh: this.loopTrollThresh,
      loopNormThresh: this.loopNormThresh
    })
    onChildChanged(configureRef, data => {
      this.$data.filters[data.key] ? this.$data.filters[data.key] = data.val() : this.$data[data.key] = data.val()
      // console.log('Config Changed', data.key, data.val(), this.$data.filters[data.key] ? this.$data.filters[data.key] : this.$data[data.key])
    })

    const video = document.querySelector('video');
    video.addEventListener('loadedmetadata', (e) => {
      const player = e.target;
      player.width = player.clientWidth;
      player.height = player.clientHeight;
    });
    video.onended = () => {
      console.log('video end: ', this.currentStoryPlot)
      if (this.oneTimeStories.includes(this.currentStoryPlot)) {
        if (this.currentStoryPlot < 5) this.currentStoryPlot += 1
        else {
          this.storyLoop += 1
          this.currentStoryPlot = 1
        }
        this.currentNormInLoop = 0
        this.currentTrollInLoop = 0
      }
    };
  },
  beforeUnmount() {
    this.chatClient.removeListener(this.followAgeListener);
    clearInterval(timeInterval)
  },
};
</script>
<style scoped>

/*#container {*/
/*  text-align: center;*/
/*  position: absolute;*/
/*  left: 0;*/
/*  right: 0;*/
/*  top: 50%;*/
/*  transform: translateY(-50%);*/
/*}*/

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
</style>
