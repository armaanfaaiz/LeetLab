import axios from "axios"

export const getJudge0LanguageId = (language)=>{
    if (!language) return null;
    const cleanLang = language.toString().trim().toUpperCase();
    const languageMap = {
        "PYTHON": 71,
        "JAVA": 62,
        "JAVASCRIPT": 63,
        "JS": 63,
        "CPP": 54,
        "C++": 54,
        "TYPESCRIPT": 74,
        "TS": 74,
    }

    return languageMap[cleanLang] || null;
}

const sleep  = (ms)=> new Promise((resolve)=> setTimeout(resolve , ms))

const decodeBase64 = (val) => {
    if (!val) return null;
    try {
        return Buffer.from(val, 'base64').toString('utf8');
    } catch {
        return val;
    }
};

export const pollBatchResults = async (tokens)=>{
    while(true){
        const {data} = await axios.get(`${process.env.JUDGE0_API_URL}/submissions/batch`,{
            params:{
                tokens:tokens.join(","),
                base64_encoded:true,
            },
            headers: {
                'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            }
        })

        const results = data.submissions;

        const isAllDone = results.every(
            (r)=> r.status && r.status.id !== 1 && r.status.id !== 2
        )

        if(isAllDone) {
            return results.map(r => ({
                ...r,
                stdout: decodeBase64(r.stdout),
                stderr: decodeBase64(r.stderr),
                compile_output: decodeBase64(r.compile_output),
            }));
        }
        await sleep(1000)
    }
}

export const submitBatch = async (submissions)=>{
    const encodedSubmissions = submissions.map(sub => ({
        ...sub,
        source_code: sub.source_code ? Buffer.from(String(sub.source_code)).toString('base64') : "",
        stdin: sub.stdin !== undefined && sub.stdin !== null ? Buffer.from(String(sub.stdin)).toString('base64') : "",
        expected_output: sub.expected_output !== undefined && sub.expected_output !== null 
            ? Buffer.from(String(sub.expected_output)).toString('base64') 
            : undefined
    }));

    const {data} = await axios.post(`${process.env.JUDGE0_API_URL}/submissions/batch?base64_encoded=true`,{
        submissions: encodedSubmissions
    }, {
        headers: {
            'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
    })

    console.log("Submission Results: ", data)

    return data // [{token} , {token} , {token}]
}


export function getLanguageName(languageId){
    const numericId = Number(languageId);
    const LANGUAGE_NAMES = {
        74: "TypeScript",
        63: "JavaScript",
        71: "Python",
        62: "Java",
        54: "C++",
    }

    return LANGUAGE_NAMES[numericId] || "Unknown"
}