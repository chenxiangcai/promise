(function (window) {
  const PENDING = 'pending'
  const RESOLVED = 'resolved'
  const REJECTED = 'rejected'

  function Promise(executor) {
    this.status = PENDING
    this.data = undefined
    this.callbacks = [] //{onResolved(),onRejected()}

    const resolve = (value) => {
      if (this.status !== PENDING) return
      this.status = RESOLVED
      this.data = value
      if (this.callbacks.length > 0) {
        setTimeout(() => {
          this.callbacks.forEach(callbackObj => callbackObj.onResolved())
        })
      }
    }
    const reject = (reason) => {
      if (this.status !== PENDING) return
      this.status = REJECTED
      this.data = reason
      if (this.callbacks.length > 0) {
        setTimeout(() => {
          this.callbacks.forEach(callbackObj => callbackObj.onRejected())
        })
      }
    }

    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  Promise.prototype.then = function (onResolved, onRejected) {
    onResolved = typeof onResolved === 'function' ? onResolved : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : reason => {
      throw reason
    }
    const _this = this
    return new Promise((resolve, reject) => {

      const handle = (callback) => {
        try {
          const result = callback(_this.data)
          if (result instanceof Promise) result.then(resolve, reject)
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

  Promise.prototype.catch = function (onRejected) {
    this.then(null, onRejected)
  }

  Promise.resolve = (value) => {
    return new Promise((resolve, reject) => {
      if (value instanceof Promise) resolve(value).then(resolve, reject)
      else resolve(value)
    })
  }
  Promise.reject = (reason) => {
    return new Promise((resolve, reject) => {
      reject(reason)
    })
  }

  Promise.all = (promises) => {
    if (!promises instanceof Array) return
    return new Promise((resolve, reject) => {
      const values = new Array(promises.length)
      let count = 0
      promises.forEach((p, index) => {
        Promise.then(p).then(value => {
          count++
          values[index] = value
          if (count === promises.length) resolve(values)
        }, reason => {
          reject(reason)
        })
      })
    })
  }

  Promise.race = (promises) => {
    if (!promises instanceof Array) return
    return new Promise((resolve, reject) => {
      promises.forEach(p => {
        Promise.then(p).then(resolve, reject)
      })
    })
  }

  window.Promise = Promise
})(window)
