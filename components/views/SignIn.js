import {Button} from "antd"

import { getAuth , signInWithPopup , GoogleAuthProvider} from "firebase/auth"
import { useRouter } from "next/dist/client/router"
import firebaseApp from "../../net/firebaseApp"




export default function SignIn(){
    const router = useRouter();
    return(
        <div className="flex justify-center items-center h-screen">
            <Button onClick={() => {
                const auth = getAuth(firebaseApp)
                const provider = new GoogleAuthProvider();
                provider.addScope('profile');
                provider.addScope('email');
                signInWithPopup(auth , provider)
                    .then(result => router.push('/'))
                    .catch(console.warn)
            }}>로그인</Button>
        </div>
    )
}