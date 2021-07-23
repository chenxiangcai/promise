(function (window) {
  //三个状态
  const PENDING = 'pending'
  const RESOLVED = 'resolved'
  const REJECTED = 'rejected'

  //executor 构造函数
  function MyPromiseDemo(executor) {
    this.status = PENDING
    this.data = undefined
    this.callbacks = []

    //resolve
    const resolve = (value) => {
      if (this.status !== PENDING) return
      this.status = RESOLVED
      this.data = value
      if (this.callbacks.length > 0) {
        setTimeout(() => {
          this.callbacks.forEach(callbackObj => {
            callbackObj.onResolved()
          })
        })
      }
    }

    //reject
    const reject = (reason) => {
      if (this.status !== PENDING) return
      this.status = REJECTED
      this.data = reason
      if (this.callbacks.length > 0) {
        setTimeout(() => {
          this.callbacks.forEach((callbackObj) => {
            callbackObj.onRejected()
          })
        })
      }
    }

    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }


  //then()
  MyPromiseDemo.prototype.then = function (onResolved, onRejected) {

    onResolved = typeof onResolved === 'function' ? onResolved : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : reason => {
      throw reason
    }

    const _this = this
    return new MyPromiseDemo((resolve, reject) => {
      const handle = (callback) => {
        console.log(this === _this)

        try {
          const result = callback(this.data)
          console.log(result)
          if (result instanceof MyPromiseDemo) result.then(resolve, reject)
          else resolve(result)
        } catch (e) {
          reject(e)
        }
      }

      if (this.status === RESOLVED) {
        setTimeout(() => {
          handle(onResolved)
        })
      } else if (this.status === REJECTED) {
        setTimeout(() => {
          handle(onRejected)
        })
      } else if (this.status === PENDING) {
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

  MyPromiseDemo.prototype.catch = function (onRejected) {
    return this.then(null, onRejected)
  }

  MyPromiseDemo.all = (promise) => {
    if (!promise instanceof Array) return
    const values = new Array(promise.length)
    let count = 0
    return new MyPromiseDemo((resolve, reject) => {
      promise.forEach((p, index) => {
        MyPromiseDemo.then(p).then(value => {
          count++
          values[index] = value
          if (count === promise.length) resolve(values)
        }, reason => {
          reject(reason)
        })
      })
    })
  }

  MyPromiseDemo.race = (promises) => {
    if (!Array.isArray(promises)) return
    return MyPromiseDemo((resolve, reject) => {
      promises.forEach(p => {
        MyPromiseDemo.then(p).then(resolve, reject)
      })
    })
  }


  window.MyPromiseDemo = MyPromiseDemo
})(window)
