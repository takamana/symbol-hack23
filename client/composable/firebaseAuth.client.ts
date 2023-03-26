import { getAuth, signInWithCustomToken, signOut, onAuthStateChanged } from 'firebase/auth'

export const useAuth = () => {
  const token = useState<string | null>('token', () => null);

  async function signIn(customToken: string) {
    return await new Promise<void>((resolve, reject) => {
      const auth = getAuth()
      return signInWithCustomToken(auth, customToken)
        .then((userCredential) => {
          userCredential.user
            .getIdToken()
            .then((idToken) => {
              token.value = idToken;
              resolve()
            })
            .catch(reject)
        })
        .catch(reject)
    })
  }

  async function logout() {
    return await new Promise<void>((resolve, reject) => {
      const auth = getAuth()
      signOut(auth)
        .then(() => {
          token.value = null;
          resolve()
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  async function checkAuthState() {
    return await new Promise<void>((resolve, reject) => {
      // client only
      if (process.server) return resolve()
      const auth = getAuth()
      onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            user
              .getIdToken()
              .then((idToken) => {
                token.value = idToken;
                resolve()
              })
              .catch(reject)
          } else {
            token.value = null
            resolve()
          }
        },
        (error) => {
          reject(error)
        }
      )
    })
  }

  return {
    signIn,
    logout,
    token,
    checkAuthState,
  }
}