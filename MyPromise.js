(function (window) {
  const PENDING = 'pending'
  const RESOLVED = 'resolved'
  const REJECTED = 'rejected'

  //executor
  function MyPromise(executor) {
    // const _this = this
    this.status = PENDING //Promise对象状态属性，初始状态为 pending
    this.data = undefined // 用于存储结果数据
    this.callbacks = [] //保存待执行的回调函数 ，数据结构：{onResolved(){},onRejected(){}}

    const resolve = (value) => {
      if (this.status !== PENDING) return
      this.status = RESOLVED
      this.data = value
      //执行异步回调函数 onResolved
      if (this.callbacks.length > 0) {  //采用settimeout 模拟
        setTimeout(() => { // 放入队列中执行所有成功的回调
          this.callbacks.forEach(callbackObj => {
            callbackObj.onResolved(value)
          })
        })
      }
    }

    const reject = (reason) => {
      if (this.status !== PENDING) return
      this.status = REJECTED
      this.data = reason
      if (this.callbacks.length > 0) {
        setTimeout(() => { // 放入队列中执行所有成功的回调
          this.callbacks.forEach(callbackObj => {
            callbackObj.onRejected(reason)
          })
        })
      }
    }

    //立即执行函数
    try {
      executor(resolve, reject)
    } catch (reason) {
      reject(reason)
    }
  }

  //then()
  MyPromise.prototype.then = function (onResolved, onRejected) {
    const _this = this
    return new MyPromise((resolve, reject) => {
      //向后传递成功的value
      onResolved = typeof onResolved == 'function' ? onResolved : value => value
      // 指定默认的失败的回调(实现错误/异常传透的关键点)
      onRejected = typeof onRejected == 'function' ? onRejected : reason => {
        throw reason
      }

      /**
       * 用于返回新promise状态函数
       * @param callback 成功或失败回调函数
       */
      function handle(callback) {
        try { //前promise执行状态决定后promise的3种状态
          const result = callback(_this.data) //前promise对象
          if (result instanceof MyPromise) { //1。返回值是promise
            result.then(resolve, reject)
            /* result.then( //获取原promise的状态
                 value => resolve(value), //前promise成功，后promise返回成功值
                 result => reject(result)
             )*/
          } else { //2。返回值为非promise值
            resolve(result)
          }
        } catch (reason) { //3。如果抛出异常，返回promise值为失败，值为reason
          reject(reason)
        }
      }

      //先调用后改状态  当前状态还是pending状态, 将回调函数保存起来
      if (this.status === PENDING) {
        this.callbacks.push({
          onResolved() {
            handle(onResolved)
          },
          onRejected() {
            handle(onRejected)
          }
        })
      }

      //先改状态后调用
      else if (this.status === RESOLVED) { //成功状态
        setTimeout(() => {
          handle(onResolved)
        })
      } else {//失败状态
        setTimeout(() => {
          handle(onRejected)
        })
      }
    })
  }

  //catch()
  MyPromise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected)
  }

  MyPromise.resolve = value => {
    return new MyPromise((resolve, reject) => {
      if (value instanceof MyPromise) value.then(resolve, reject)
      else resolve(value)
    })
  }

  MyPromise.reject = reason => new MyPromise((resolve, reject) => reject(reason))

  MyPromise.all = promises => {
    if (!Array.isArray(promises)) return
    const values = new Array(promises.length)
    let count = 0
    return new MyPromise((resolve, reject) => {
      promises.forEach((p, index) => {
        MyPromise.resolve(p).then(  //包装数组中非promise的值为promise
            value => {
              count++
              values[index] = value //保证顺序对应，不可以用push
              //如果全部成功，返回
              if (count === promises.length) resolve(values)
            },
            reason => {
              reject(reason)
            }
        )
      })
    })
  }

  MyPromise.race = promises => {
    if (!Array.isArray(promises)) return
    return new MyPromise((resolve, reject) => {
      promises.forEach(p => {
        MyPromise.resolve(p).then(resolve, reject)
      })
    })
  }
  window.MyPromise = MyPromise
})(window)
