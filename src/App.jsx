import { ConfigProvider } from 'antd'
import './App.css'
import Chat from './pages/chat'
import themeConfig from '../antd.config'


function App() {

  return (
    <ConfigProvider theme={themeConfig}>
      <Chat />
    </ConfigProvider>

  )
}

export default App
