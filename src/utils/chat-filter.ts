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


    existRepeatedCharacter(text: string): boolean {
        if (text.length == 1) return false;

        for (let i = 1; i <= text.length / 2; i ++) {
            if (text.length % i) continue
            const sub = text.substring(0, i)
            if (this.isRepeating(sub, text)) return true;
        }

        return false;
    }

    isRepeating = (sub: any, str: any): boolean => {
        if(str.length > sub.length)
            return str.substring(0,sub.length) ===sub && this.isRepeating(sub, str.substring(sub.length, str.length));

        return str === sub;
    }

    findDuplicateWords = (str: string): boolean => {
        const strArr = str.split(" ");
        const res = [] as Array<string>;
        for(let i = 0; i < strArr.length; i++){
            if(strArr.indexOf(strArr[i]) !== strArr.lastIndexOf(strArr[i])){
                if(!res.includes(strArr[i])){
                    res.push(strArr[i]);
                }
            }
        }

        let reWord = res.join(" ")
        reWord += ''
        str += ''
        if (reWord.length <= 2) return false
        else {
            return (str.match( new RegExp(
                    reWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length > 2
        }
    };
}



export const chatFilter = new ChatFilter();
export default chatFilter;
