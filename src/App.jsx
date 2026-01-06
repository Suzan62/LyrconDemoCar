import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import AddCar from './pages/AddCar';
import KYCWorkflow from './pages/kyc/KYCWorkflow';
import VehicleDetails from './pages/VehicleDetails';
// const VehicleDetails = () => <div className="p-4">Vehicle Details (Coming Soon)</div>;

import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import FinanceList from './pages/Finance/FinanceList';
import AddFinance from './pages/Finance/AddFinance';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import InquiriesList from './pages/Inquiries/InquiriesList';
import AddInquiry from './pages/Inquiries/AddInquiry';
import InsuranceList from './pages/Insurance/InsuranceList';
import AddInsurance from './pages/Insurance/AddInsurance';
import UserList from './pages/Users/UserList';
import AddUser from './pages/Users/AddUser';
import ProtectedRoute from './components/ProtectedRoute';
import { AppProvider } from './context/AppContext';
import { Provider } from 'react-redux';
import { store } from './store/store';

const IS_DEMO_RESTRICTED = false; // Set to false to unblock all pages

function App() {
  return (
    <Provider store={store}>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              {/* If restricted, render nothing (Sidebar/Layout still visible), otherwise render Dashboard */}
              <Route index element={IS_DEMO_RESTRICTED ? <></> : <Dashboard />} />

              <Route path="inventory" element={IS_DEMO_RESTRICTED ? <></> : <Inventory />} />
              <Route path="inventory/:id/edit" element={IS_DEMO_RESTRICTED ? <></> : <AddCar />} />
              <Route path="add-car" element={IS_DEMO_RESTRICTED ? <></> : <AddCar initialMode="New" />} />
              <Route path="purchase-old-car" element={IS_DEMO_RESTRICTED ? <></> : <AddCar initialMode="Purchase" />} />
              <Route path="sell-old-car" element={IS_DEMO_RESTRICTED ? <></> : <AddCar initialMode="Sale" />} />
              <Route path="kyc" element={IS_DEMO_RESTRICTED ? <></> : <KYCWorkflow />} />
              <Route path="profile" element={IS_DEMO_RESTRICTED ? <></> : <Profile />} />

              <Route path="inquiries" element={IS_DEMO_RESTRICTED ? <></> : <InquiriesList />} />
              <Route path="inquiries/create" element={IS_DEMO_RESTRICTED ? <></> : <AddInquiry />} />

              <Route path="finance" element={IS_DEMO_RESTRICTED ? <></> : <FinanceList />} />
              <Route path="finance/create" element={IS_DEMO_RESTRICTED ? <></> : <AddFinance />} />

              <Route path="insurances" element={IS_DEMO_RESTRICTED ? <></> : <InsuranceList />} />
              <Route path="insurances/add" element={IS_DEMO_RESTRICTED ? <></> : <AddInsurance />} />

              <Route path="users" element={IS_DEMO_RESTRICTED ? <></> : <UserList />} />
              <Route path="users/create" element={IS_DEMO_RESTRICTED ? <></> : <AddUser />} />
              <Route path="users/:id/edit" element={IS_DEMO_RESTRICTED ? <></> : <AddUser />} />

              {/* Settings matches user request to remain working */}
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<Notifications />} />

              <Route path="vehicle/:id" element={IS_DEMO_RESTRICTED ? <></> : <VehicleDetails />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </Provider>
  );
}

export default App;
