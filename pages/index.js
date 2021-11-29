import Head from 'next/head';
import {Formik , FieldArray} from "formik";
import { useState , Fragment, useCallback, useMemo, useEffect } from 'react';
import produce from "immer";
import FirebaseApp from '../net/firebaseApp';
import {addDoc , collection , getFirestore , getDoc, doc , onSnapshot} from 'firebase/firestore'


const formatter = Intl.NumberFormat('ko-kr')
const menu = [
  {name : "에스프레소" , price: 2900},
  {name : "아메리카노" , price: 3500},
]

function sum(array){
   return array.reduce((acc, num) => {
    acc += num
    return acc
  }, 0)
}

const store = getFirestore(FirebaseApp);
const orders = collection(store , "orders");



export default function Home() {
  const [items , setItems] = useState(menu.map(item => ({...item , count: 0})));

  const addItem = useCallback( (name) => {

     setItems(produce(items , draft => {
          const index = items.findIndex(item => item.name === name);
          draft[ index ].count++
        }))

  }, [items])

  const removeItem = useCallback((name) => {
    setItems(produce(items , draft => {
      const index = items.findIndex(item => item.name === name);
      if(draft[index].count > 0){
          draft[ index ].count--
      }
    }))
  }, [items])

  const total = useMemo(() => {
    return sum(items.map(item => item.price * item.count))
  }, [items])

  const [orderId , setOrderId] = useState(null);
  const [order , setOrder] = useState(null);

  const statusClassName = useMemo(() => {
        switch(order?.status){
          case "주문 완료":
                return 'text-secondary'
          case "제조중":
                return 'text-info'
          case "제조 완료":
                return 'text-success'
          case "픽업 완료":
                setItems(menu.map(item => ({...item , count : 0})))
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



  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container">
            <h1 className="mt-2">커피 주문</h1>

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
                  const order = {
                    ...values,
                    items,
                    status: '주문 완료',
                    createdAt : new Date(),
                  }
                  const result = await addDoc(orders , order);
                  const id = result._key.path.segments[1];
                  setOrderId(id);

                  // const ref = doc(store , 'orders', id);
                  // const orderData = await getDoc(ref);
                  // const data = orderData.data();
                  // setOrder({
                  //   id,
                  //   ...data,
                  // })
                  // const resetName = values.name = ""
                  // resetName;
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
                            <input type="text" 
                                   className="form-control" 
                                   placeholder="이름을 입력해주세요." 
                                   name="name"
                                   value={values.name}
                                   onChange={handleChange}
                                   onBlur={handleBlur}
                                   />
                              {errors.name && touched.name && <p className="text-danger ml-1 mt-2">{errors.name}</p>}
                          </div>
                          <dl className="row">
                            {menu.map(item => (
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
                                               onClick={() => addItem( item.name )}
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
                                    <Fragment key={item.name}>
                                      <dt>{item.name} &times; {item.count}</dt>
                                      <dd className="flex justify-between items-end">
                                          <div>{formatter.format(item.price)}원</div>
                                          <div>
                                          <button type="button" 
                                               className="btn btn-outline-secondary btn-xs"
                                               onClick={() => removeItem( item.name )}
                                               >뺴기</button>
                                          </div>
                                      </dd>
                                    </Fragment>
                                ))}
                              </dl>
                              


                            <div className="mb-3">
                                합계 : {total}원
                            </div>
                            {errors.total && (<p className="text-danger">{errors.total}</p>)}
                          
                         


                     
                          {!order && (
                             <button type="submit" className="btn btn-primary btn-lg">주문</button>
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
