import { useEffect } from "react"
import 'antd/dist/antd.css'
function MyApp({ Component, pageProps }) {
  useEffect(() => {
    var IMP = window.IMP
    IMP.init("imp02113460");
  }, [])
  return <Component {...pageProps} />
}

export default MyApp
