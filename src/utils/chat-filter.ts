import {profanityList} from './words'

export class ChatFilter {
    private profanityList: Array<string>;

    constructor() {
        this.profanityList = profanityList
    }

    existsProfanity(text: string): boolean {
        // return this.profanityList.some(v => text.includes(v))
        let containProf = false;
        this.profanityList.map(po => {
            const idx = text.indexOf(po)
            if (!containProf && idx !== -1 && (idx+po.length === text.length || text[idx+po.length] === ' ')) {
                // console.log(idx, po, text[idx+po.length])
                containProf = true
            }
        })

        return containProf
    }
}

export const chatFilter = new ChatFilter();
export default chatFilter;
