import Head from 'next/head';
import {Formik , FieldArray} from "formik";
import { useState , Fragment, useCallback, useMemo, useEffect } from 'react';
import produce from "immer";
import firebaseApp from '../net/firebaseApp';
import {addDoc , collection , getFirestore   , getDoc, doc , onSnapshot} from 'firebase/firestore'
import {getAuth , signOut} from "firebase/auth"
import uid from 'tiny-uid';
import { Button } from 'antd';
import { useRouter } from 'next/dist/client/router';
import SignIn from '../components/views/SignIn';
import Loading from '../components/views/Loading';


const formatter = Intl.NumberFormat('ko-kr')
const coffee = [
  {name : "에스프레소" , price: 2900},
  {name : "아메리카노" , price: 3500},
  {name : "카페라떼" , price: 5600},
  {name : "카페모카" , price: 4500},
  {name : "카푸치노" , price: 5600},
]

const drinking = [
  {name : "화이트 초콜릿 모카" , price: 6600},
  {name : "카라멜" , price: 5700},
  {name : "모카" , price: 5600},
  {name : "화이트 딸기 크림" , price: 7600},
  {name : "망고 바나나" , price: 6600},
]


const dessert = [
  {name : "고구마 케익" , price: 7600},
  {name : "타라미슈" , price: 5700},
  {name : "클라우드 치즈 케익" , price: 5300},
  {name : "호두 당근 케익" , price: 6600},
  {name : "클래식 초콜릿 케익" , price: 4500},
]

function sum(array){
   return array.reduce((acc, num) => {
    acc += num
    return acc
  }, 0)
}

const store = getFirestore(firebaseApp);
const orders = collection(store , "orders");


export default function Home() {
  const [items , setItems] = useState(coffee.map(item => ({...item , count: 0})));
  const [drinkings , setDrinking] = useState(drinking.map(item => ({...item , count: 0})))
  const router = useRouter();
  const auth = getAuth(firebaseApp) 
  const [loaded , setLoaded] = useState(false)
  const [credential , setCredential] = useState(null)




  const addCoffee = useCallback( (name) => {
     setItems(produce(items , draft => {
          const index = items.findIndex(item => item.name === name);
          draft[ index ].count++
        }))

  }, [items])

  const removeCoffee = useCallback((name) => {
    setItems(produce(items , draft => {
      const index = items.findIndex(item => item.name === name);
      if(draft[index].count > 0){
          draft[ index ].count--
      }
    }))
  }, [items])


  const addDrinking = useCallback( (name) => {
    setDrinking(produce(drinkings , draft => {
      const index = drinkings.findIndex(item => item.name === name);
      draft[ index ].count++
    }))
  }, [drinkings])


  const removeDrinking = useCallback( (name) => {
    setDrinking(produce(drinkings , draft => {
      const index = drinkings.findIndex(item => item.name === name)
      if(draft[index].count > 0){
        draft[index].count--
      }
    }))
  }, [drinkings])


  const coffeeTotal = sum(items.map(item => item.price * item.count)) 
  const drinkingTotal = sum(drinkings.map(item => item.price * item.count))
  const total = useMemo(() => {
    return coffeeTotal + drinkingTotal
  }, [items , drinkings])

  const [orderId , setOrderId] = useState(null);
  const [order , setOrder] = useState(null);

 
   const requestPayment = useCallback(() => {
     return new Promise((resolve , reject) => {
             // IMP.request_pay(param, callback) 결제창 호출
             IMP.request_pay({ // param
               pg: "html5_inicis",
               pay_method: "card",
               merchant_uid: uid(),
               name: items.map(item => `${item.name} ${item.count}개`).join(', '),
               amount: total,
               buyer_email: credential.email,
               buyer_name: credential.displayName,
               buyer_tel: credential.phoneNumber,
               buyer_addr: "매장 방문",
               buyer_postcode: "01181"
           }, function (rsp) { // callback
               if (rsp.success) {
                   resolve(rsp)
                   console.log('결제성공')
              
               } else {
                   reject('결제 실패')
               }
           });
     })
  }, [items , total])

  const statusClassName = useMemo(() => {
        switch(order?.status){
          case "주문 완료":
                return 'text-secondary'
          case "제조중":
                return 'text-info'
          case "제조 완료":
                return 'text-success'
          case "픽업 완료":
                setItems(coffee.map(item => ({...item , count : 0})))
                setDrinking(drinkings.map(item => ({...item , count : 0})))
                setOrderId(null)
                setOrder(null)
                return 'text-muted'
                default : 
                    return 'text-secondary';
        }
  }, [order])


    useEffect(() => {
      if(orderId){
        return onSnapshot(doc(store , 'orders' , orderId) , snapshot => {
                    setOrder(snapshot.data());
        })
      }
    }, [orderId])

    useEffect(() => {
      auth.onAuthStateChanged(credential => {
          setCredential(credential);
          setLoaded(true)
          
      })
    }, [])
    if(!loaded){
      return <Loading />
    }

    if(!credential){
      return <SignIn />
    }


  
  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="container">
        <div className="flex flex-row justify-between items-center" style={{borderBottom: "1px solid #eee"}}>
            <h1 className="mt-2"><img src="./images/starbus.png" className="img-thumbnail" alt="..." 
                style={{width : '120px'} , {height : '120px'}}
            /></h1>
            <Button key="sign-out" onClick={() => {
                if(!confirm('정말로 로그아웃 하실건가요?')){
                  return false
                }else{
                  auth.signOut();
                  router.push('/sign-in')
                }

               
            }}>로그아웃</Button>
        </div>
            <Formik
              initialValues={{
                name: '',
              }}
              validate ={values => {
                const errors = {};
                if(!values.name){
                  errors.name = "이름 혹은 별명을 입력해주세요."
                }
                if(total === 0){
                  errors.total = '원하시는 상품을 담아주세요!'
                }

                return errors
              }}
              onSubmit={ async (values) => {
                 const paymentResult = await requestPayment();
                  const order = {
                    ...values,
                    drinkings,
                    items,
                    status: '주문 완료',
                    createdAt : new Date(),
                    paymentResult,
                  }
                
                  const result = await addDoc(orders , order);
                  const id = result._key.path.segments[1];
                  setOrderId(id);
                  const resetName = values.name = ""
                  resetName;
                  // const ref = doc(store , 'orders', id);
                  // const orderData = await getDoc(ref);
                  // const data = orderData.data();
                  // setOrder({
                  //   id,
                  //   ...data,
                  // })
                  }}
              >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                handleSubmit,
                isSubmitting
              }) => (
                  <form onSubmit={handleSubmit}>
                           <div className="my-4">
                             <label htmlFor="name" className="px-2 mb-2" style={{fontSize: "18px" , fontWeight : "bold" , color: "#666"} }>고객명을 입력주세요</label>
                            <input type="text" 
                                   className="form-control" 
                                   id="name"
                                   placeholder="이름을 입력해주세요." 
                                   name="name"
                                   value={values.name}
                                   onChange={handleChange}
                                   onBlur={handleBlur}
                                   required
                                   />
                              {errors.name && touched.name && <p className="text-danger ml-1 mt-2">{errors.name}</p>}
                          </div>
                          
                          {/* <dl className="row">
                            {coffee.map(item => (
                              <Fragment key={item.name}>
                                  <dt className="col-sm-3">
                                    <label htmlFor="coffee1">
                                         {item.name}
                                    </label>
                                  </dt>
                                  <dd className="col-sm-9 flex justify-between" >
                                    <div className="">
                                    {formatter.format(item.price)}원
                                    </div>
                                    <div className="mt-1">
                                       <button type="button" 
                                               className="btn btn-outline-secondary btn-xs"
                                               onClick={() => addCoffee( item.name )}
                                               >담기</button>
                                    </div>
                                  </dd>
                              </Fragment>
                            ))}                        
                          </dl> */}

                          
                        <div className="row">
                              <div className="col">
                                <p className="fs-3 fw-bold">커피를 담아주세요</p>
                                  <ul className="nav nav-tabs">
                                    <li className="nav-item">
                                      <a className="nav-link active" data-toggle="tab" href="#qwe">커피</a>
                                    </li>
                                    <li className="nav-item">
                                      <a className="nav-link" data-toggle="tab" href="#asd">음료</a>
                                    </li>
                                    <li className="nav-item">
                                      <a className="nav-link" data-toggle="tab" href="#zxc">디저트</a>
                                    </li>
                                  </ul>
                                  <div className="tab-content">
                                  <div className="tab-pane fade show active" id="qwe">
                                    <dl className="row py-3 px-2">
                                    {coffee.map(item => (
                                          <Fragment key={item.name}> 
                                            <dt>
                                                <label htmlFor="coffee1">
                                                  {item.name}
                                                </label>
                                            </dt>
                                            <dd className="flex justify-between">
                                              <div>
                                              {formatter.format(item.price)}원
                                              </div>
                                              <div className="mt-1">
                                            <button type="button" 
                                               className="btn btn-outline-secondary btn-xs"
                                               onClick={() => addCoffee( item.name )}
                                               >담기</button>
                                             </div>
                                            </dd> 
                                          </Fragment>
                                    ))}
                                    </dl>

                                    <hr />

                                    <h2>주문서</h2>
                                          <dl>
                                              {items.map(item => (
                                                item.count > 0 && (
                                                  <Fragment key={item.name}>
                                                  <dt>{item.name} &times; {item.count}</dt>
                                                  <dd className="flex justify-between items-end">
                                                      <div>{formatter.format(item.price)}원</div>
                                                      <div>
                                                      <button type="button" 
                                                            className="btn btn-outline-secondary btn-xs"
                                                            onClick={() => removeCoffee( item.name )}
                                                            >뺴기</button>
                                                      </div>
                                                  </dd>
                                                </Fragment>
                                                )
                                              ))}
                                          </dl>                                
                                      </div>




                                    <div className="tab-pane fade" id="asd">
                                       <dl className="row py-3 px-2">
                                            {drinking.map(item => (
                                                <Fragment key={item.name}>
                                                  <dt>
                                                    <label htmlFor="">
                                                        {item.name}
                                                    </label>
                                                  </dt>
                                                  <dd className="flex justify-between">
                                                    <div>
                                                      {formatter.format(item.price)}
                                                    </div>
                                                    <div>
                                                     
                                                      <button type="button" className="btn btn-outline-secondary btn-xs" 
                                                          onClick={() => addDrinking(item.name)}>
                                                        담기
                                                      </button>
                                                    </div>
                                                  </dd>
                                                </Fragment>
                                            ))}
                                       </dl>
                                       <hr />
                                        <h2>주문서</h2>
                                        <dl>
                                          {drinkings.map(item => (
                                              item.count > 0 && (
                                                <Fragment key={item.name}>
                                                <dt>{item.name} &times; {item.count}</dt>
                                                <dd className="flex justify-between items-end">
                                                  <div>{formatter.format(item.price)}원</div>
                                                  <div>
                                                    <button type="button" className="btn btn-outline-secondary btn-xs" 
                                                      onClick={() => removeDrinking(item.name)}
                                                    >빼기</button>
                                                  </div>
                                                </dd>
                                            </Fragment>
                                              )
                                          ))}
                                        </dl>

                                    </div>




                                    <div className="tab-pane fade" id="zxc">
                                      <p>Curabitur dignissim quis nunc vitae laoreet. Etiam ut mattis leo, vel fermentum tellus. Sed sagittis rhoncus venenatis. Quisque commodo consectetur faucibus. Aenean eget ultricies justo.</p>
                                    </div>




                                  </div>
                              </div>
                            </div>

                       
                            

                    
                              
                          
                              


                            <div className="mb-3">
                                합계 : {total}원
                            </div>
                            {errors.total && (<p className="text-danger">{errors.total}</p>)} 
                           
                         


                     
                          {!order && (
                             <button type="submit" className="btn btn-primary btn-lg mb-3">주문</button>
                          )}
                          {order && (
                             <p>주문 상태 : <span className={statusClassName} style={{fontWeight : "bold"}}>{order.status}</span></p>
                          )}

                  </form>
              )}
            </Formik>
      </div>
    </div>
  )
}
