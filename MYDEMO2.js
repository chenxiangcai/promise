(function (window) {
  const PENDING = 'pending'
  const RESOLVED = 'resolved'
  const REJECTED = 'rejected'

  function MYDEMO2(executor) {
    this.status = PENDING
    this.data = undefined
    this.callbacks = []

    const resolve = (value) => {
      if (this.status !== PENDING) return
      this.status = RESOLVED
      this.data = value
      if (this.callbacks.length > 0) {
        setTimeout(() => {
          this.callbacks.forEach(callbackObj => callbackObj.onResolved(value))
        })
      }
    }

    const reject = (reason) => {
      if (this.status !== PENDING) return
      this.status = REJECTED
      this.data = reason
      if (this.callbacks.length > 0) {
        this.callbacks.forEach(callbackObj => callbackObj.onRejected(reason))
      }
    }

    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  MYDEMO2.prototype.then = function (onResolved, onRejected) {
    onResolved = typeof onResolved === 'function' ? onResolved : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : reason => {
      throw reason
    }

    const _this = this
    return new MYDEMO2((resolve, reject) => {
      function handle(callback) {
        console.log(_this === this)
        try { //前promise执行状态决定后promise的3种状态
          const result = callback(_this.data) //前promise对象
          console.log(result)
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

      // const handle = (callback) => {
      //   try {
      //     const result = callback(_this.data)
      //     if (result instanceof MYDEMO2) result.then(resolve, reject)
      //     else resolve(result)
      //   } catch (e) {
      //     reject(e)
      //   }
      // }

      if (this.status === RESOLVED) setTimeout(() => handle(onResolved))
      else if (this.status === REJECTED) setTimeout(() => handle(onRejected))
      else if (this.status === PENDING) {
        this.callbacks.push({
          onResolved() {
            handle(onResolved)
          },
          onRejected() {
            handle(onRejected)
          }
        })
      }
    })
  }

  MYDEMO2.prototype.catch = function (onRejected) {
    this.then(null, onRejected)
  }

  MYDEMO2.resolve = (value) => {
    return new MYDEMO2((resolve, reject) => {
      if (value instanceof MYDEMO2) value.then(resolve, reject)
      else resolve(value)
    })
  }

  MYDEMO2.reject = (reason) => new MYDEMO2((resolve, reject) => reject(reason))


  MYDEMO2.all = (promises) => {
    if (!promises instanceof Array) return
    const values = new Array(promises.length)
    let count = 0
    return new MYDEMO2((resolve, reject) => {
      promises.forEach((p, index) => {
        MYDEMO2.resolve(p).then(
            value => {
              count++
              values[index] = value
              if (count === promises.length) resolve(values)
            },
            reason => {
              reject(reason)
            }
        )
      })
    })
  }

  MYDEMO2.race = (promises) => {
    if (!promises instanceof Array) return
    return new MYDEMO2((resolve, reject) => {
      promises.forEach(p => {
        MYDEMO2.resolve(p).then(resolve, reject)
      })
    })
  }
  window.MYDEMO2 = MYDEMO2
})(window)
