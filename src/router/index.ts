import {createRouter, createWebHistory} from '@ionic/vue-router';
import {RouteRecordRaw} from 'vue-router';
// import {RefreshingAuthProvider} from '@twurple/auth';
// import {store, MUTATIONS} from '../store/index';


const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/views/Home.vue'),
    },
    {
        path: '/chat',
        name: 'chat',
        component: () => import('../views/Chat.vue')
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

// const clientId = process.env.VUE_APP_CLIENT_ID;
// const clientSecret = process.env.VUE_APP_CLIENT_SECRET;

// vue router before each
// router.beforeEach(async (to, from, next) => {
//     const tokenData = window.localStorage.getItem("tokenData");
//
//     if (tokenData) {
//         const token = JSON.parse(tokenData);
//         new RefreshingAuthProvider(
//             {
//                 clientId,
//                 clientSecret,
//                 onRefresh: async newTokenData => {
//                     console.log('refresh');
//                     await window.localStorage.setItem(
//                         "tokenData",
//                         JSON.stringify({
//                             accessToken: token.accessToken,
//                             refreshToken: newTokenData,
//                             expiresIn: 360,
//                             obtainmentTimestamp: Date.now(),
//                             scope: token.scope
//                         })
//                     );
//                 },
//             },
//             token
//         );
//         next();
//     } else {
//         next();
//     }
// })

export default router
