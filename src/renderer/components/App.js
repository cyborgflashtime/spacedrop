import React from 'react'
import { ipcRenderer, remote, clipboard } from 'electron'
import { Container } from 'react-bootstrap'
import { useNotifications } from '../lib/notifications'
import { clone } from '../lib/util'
import Toolbar from './Toolbar'
import Wormholes from './Wormholes'
import WormholeModal from './WormholeModal'
import '../../../static/scss/index.scss'

const { dialog } = remote
// Notification ref
let notifications = null
// Initial modal state used to reset modals
const initModalsState = {
  createWormhole: false
}
// Root component
export default class App extends React.Component {
  static contextType = useNotifications(true)
  constructor (props) {
    super(props)
    this.state = {
      identity: '',
      wormholes: [],
      active: '',
      ...clone(initModalsState)
    }

    // Bindings
    this.activate = this.activate.bind(this)
    this.updateState = this.updateState.bind(this)
    this.closeModals = this.closeModals.bind(this)
    this.openModal = this.openModal.bind(this)
    this.sendFileHandler = this.sendFileHandler.bind(this)
    this.createWormhole = this.createWormhole.bind(this)
    this.copyIdentity = this.copyIdentity.bind(this)

    // Add event listeners
    ipcRenderer.on('open-modal', (event, modal) => this.openModal(modal))
    ipcRenderer.on('modal-error', (event, err) => this.showModalError(err))
    ipcRenderer.on('update-state', this.updateState)
  }

  componentDidMount () {
    // Init notifications via the context
    notifications = this.context
    // Let main process show notifications
    ipcRenderer.on('notify', (event, ...args) => notifications.show(...args))
    // Load state from main if not already loaded
    ipcRenderer.send('do-update-state')
  }

  activate (active) {
    this.setState({ active })
  }

  // Updates internal state thereby updating the UI
  updateState (event, state, resetState) {
    let newState = { ...state }
    if (resetState) {
      // Reset state
      this.closeModals()
      notifications && notifications.clear()
    }
    console.log(newState, resetState)
    this.setState(newState)
  }

  // Closes all the modals
  closeModals () {
    this.setState({
      ...clone(initModalsState)
    })
  }

  // Shows the specified modal
  openModal (name) {
    console.log('Opening modal ' + name)
    let newModalState = clone(initModalsState)
    newModalState[name] = true
    this.setState(newModalState)
  }

  // Handles sending a file
  async sendFileHandler () {
    if (!this.state.active)
      return notifications.show('No wormhole', 'error', true, 3000)
    const title = 'Select the file to send'
    // Filter based on type selected
    const filters = [{ name: 'All Files', extensions: ['*'] }]
    const { canceled, filePaths } = await dialog.showOpenDialog(
      remote.getCurrentWindow(),
      {
        properties: ['openFile'],
        title,
        filters
      }
    )
    // Ignore if user cancelled
    if (canceled || !filePaths) return
    console.log(filePaths)
    ipcRenderer.send('send-file', filePaths[0])
  }

  createWormhole ({ name, id }) {
    if (!name || !id)
      return notifications.show('Details missing', 'error', true, 3000)

    const alreadyExists = this.state.wormholes.find(w => w.id === id)
    const isMe = this.state.identity === id
    if (alreadyExists || isMe)
      return notifications.show('Already added', 'error', true, 3000)

    // Show persistent composing notification
    notifications.show('Warping space-time...', null, false)

    ipcRenderer.send('create-wormhole', name, id)
  }

  copyIdentity (e) {
    clipboard.writeText(this.state.identity)
    notifications.show('Copied Spacedrop ID', null, true, 3000)
    if (e) e.preventDefault()
  }

  // Render the App UI
  render () {
    return (
      <div className='App'>
        <WormholeModal
          type='Create'
          show={this.state.createWormhole}
          onHide={() => this.closeModals()}
          onSubmit={this.createWormhole}
        />
        <Container>
          <Toolbar
            onCreateWormholeClick={() => this.openModal('createWormhole')}
            onSendClick={this.sendFileHandler}
            onCopyIdentityClick={this.copyIdentity}
          />
          <Wormholes
            active={this.state.active}
            setActive={this.activate}
            wormholes={this.state.wormholes}
          />
        </Container>
      </div>
    )
  }
}
