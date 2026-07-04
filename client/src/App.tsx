
import './index.css'
import { Route, Routes } from 'react-router-dom'
import { SyncusHomePage } from './features/homepage/pages/home'
import { SignUpPage } from './features/auth/pages/signUp'
import { SignInPage } from './features/auth/pages/SignIn'
import ChatLayout from './features/chat/layout/chatLayout'
import ProfilePage from './features/userprofile/pages/userprofile'
import { ErrorBoundary } from './shared/helper/errorboundary'
import { ProtectedRoute, PublicRoute, isTokenExpired } from './shared/components/protectedRoute/protectedRoute'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem('access_token');
      if (token && isTokenExpired(token)) {
        console.warn('Session expired. Logging out...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        sessionStorage.clear();
        
        // Redirect to login page if currently on protected route
        const currentPath = window.location.pathname;
        if (currentPath !== "/signin" && currentPath !== "/signup" && currentPath !== "/") {
          window.location.href = '/signin';
        }
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path='/' element={<SyncusHomePage />} />
        <Route path='/signup' element={<PublicRoute><SignUpPage /></PublicRoute>} />
        <Route path='/signin' element={<PublicRoute><SignInPage /></PublicRoute>} />
        <Route path='/chat' element={<ProtectedRoute><ChatLayout /></ProtectedRoute>} />
        <Route path='/profile' element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App



// import './App.css'
// import { Route, Routes } from 'react-router-dom';
// import { Layout } from './components/layout';
// import { DashboardPage } from './pages/dashboard';
// import { CustomerPage } from './pages/customer';
// import ProductPage from './pages/product';
// import { Login } from './pages/auth/Login';
// import { Register } from './pages/auth/register';
// import ProtectedRoute from './pages/protectedRoute';
// import { ContactPage } from './pages/contact';
// import { Ecommerce } from './pages/ecommerce';
// import { Vendor } from './pages/vendor';
// import { Profile } from './pages/profile';
// function App() {


//   return (
//     <Routes>
//       <Route path='/login' element={<Login />} />
//       <Route path='/register' element={<Register />} />
//       <Route element={
//         <ProtectedRoute>
//           <Layout />
//         </ProtectedRoute>
//       }>
//         <Route path='/' element={<DashboardPage />} />
//         <Route path='/ecommerce' element={<Ecommerce />} />
//         <Route path='/customer' element={<CustomerPage />} />
//         <Route path='/product' element={<ProductPage />} />
//         <Route path='/contact' element={<ContactPage />} />
//         <Route path='/vendor' element={<Vendor />} />
//         <Route path='/profile' element={<Profile />} />
//       </Route>
//     </Routes>
//   )
// }

// export default App
