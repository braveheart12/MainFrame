//@flow

import { ipcRenderer as ipc, remote } from 'electron'
import React, { Component } from 'react'
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native-web'
import type { ID } from '@mainframe/utils-id'

import { client, callMainProcess } from '../electronIpc'
import AppInstallModal from './AppInstallModal'
import Button from '../Button'
import ModalView from '../ModalView'
import IdentitySelectorView from './IdentitySelectorView'
import VaultManagerModal from './VaultManagerModal'

import colors from '../colors'

const fs = remote.require('fs-extra')
const path = remote.require('path')

type VaultPath = string

type VaultsData = {
  paths: Array<VaultPath>,
  defaultVault: VaultPath,
  vaultOpen: boolean,
}

type State = {
  showAppInstallModal: boolean,
  vaultsData?: VaultsData,
  selectIdForApp?: ?Object,
  installedApps: Array<Object>,
}

export default class App extends Component<{}, State> {
  state = {
    showAppInstallModal: false,
    installedApps: [],
  }

  componentDidMount() {
    this.getVaultsData()
  }

  async getVaultsData() {
    try {
      const vaultsData = await callMainProcess('getVaultsData')
      this.setState({
        vaultsData,
      })
      if (vaultsData.vaultOpen) {
        this.getInstalledApps()
      }
    } catch (err) {
      console.warn(err)
    }
  }

  async getInstalledApps() {
    try {
      const res = await client.getInstalledApps()
      this.setState({
        installedApps: res.apps,
      })
    } catch (err) {
      console.warn('error: ', err)
    }
  }

  onOpenedVault = () => {
    this.getVaultsData()
  }

  // HANDLERS

  onPressInstall = () => {
    this.setState({
      showAppInstallModal: true,
    })
  }

  onCloseInstallModal = () => {
    this.setState({
      showAppInstallModal: false,
    })
  }

  onInstallComplete = (appID: ID) => {
    this.onCloseInstallModal()
    this.getInstalledApps()
  }

  onOpenApp = async (appID: ID) => {
    const app = this.state.installedApps.find(a => a.appID === appID)
    if (!app) {
      return
    }
    if (app.users.length > 1) {
      this.setState({
        selectIdForApp: app,
      })
    } else {
      this.openApp(app.appID, app.users[0].id)
    }
  }

  onCloseIdSelector = () => {
    this.setState({
      selectIdForApp: undefined,
    })
  }

  onSelectAppUser = (userID: ID) => {
    if (this.state.selectIdForApp) {
      this.openApp(this.state.selectIdForApp.appID, userID)
    }
  }

  async openApp(appID: ID, userID: ID) {
    await callMainProcess('launchApp', [appID, userID])
    this.setState({
      selectIdForApp: undefined,
    })
  }

  // RENDER

  renderVaultManager() {
    if (this.state.vaultsData) {
      const { vaultsData } = this.state
      return (
        <VaultManagerModal
          paths={vaultsData.paths}
          defaultVault={vaultsData.defaultVault}
          onOpenedVault={this.onOpenedVault}
        />
      )
    }
  }

  render() {
    if (!this.state.vaultsData || !this.state.vaultsData.vaultOpen) {
      return this.renderVaultManager()
    }
    const appRows = this.state.installedApps.map(app => {
      const manifest = app.manifest

      const onClick = async () => {
        this.onOpenApp(app.appID)
      }

      const onClickDelete = () => {
        client.removeApp(app.appID)
        this.getInstalledApps()
      }

      return (
        <View key={app.appID} style={styles.appRow}>
          <View style={styles.appIcon} />
          <View style={styles.appInfo}>
            <TouchableOpacity onPress={onClick} style={styles.openApp}>
              <Text style={styles.appName}>{app.manifest.name}</Text>
              <Text style={styles.appUsers}>
                {`Identities: ${app.users.map(u => u.data.name).join(', ')}`}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={onClickDelete}
            style={styles.deleteApp}
            key={app.appID}>
            <Text style={styles.deleteLabel}>Delete</Text>
          </TouchableOpacity>
        </View>
      )
    })

    const installModal = this.state.showAppInstallModal ? (
      <AppInstallModal
        onRequestClose={this.onCloseInstallModal}
        onInstallComplete={this.onInstallComplete}
      />
    ) : null

    const appIdentitySelector = this.state.selectIdForApp ? (
      <ModalView isOpen={true} onRequestClose={this.onCloseIdSelector}>
        <IdentitySelectorView
          users={this.state.selectIdForApp.users}
          onSelectId={this.onSelectAppUser}
        />
      </ModalView>
    ) : null

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mainframe Launcher</Text>
        <View style={styles.apps}>{appRows}</View>
        <Button title="Install New App" onPress={this.onPressInstall} />
        {installModal}
        {appIdentitySelector}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
  },
  title: {
    fontSize: 20,
  },
  apps: {
    marginTop: 20,
    flex: 1,
  },
  appRow: {
    padding: 10,
    marginBottom: 10,
    borderColor: colors.LIGHT_GREY_E8,
    borderWidth: 1,
    flexDirection: 'row',
    borderRadius: 3,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.LIGHT_GREY_E8,
  },
  openApp: {
    flex: 1,
  },
  deleteApp: {
    backgroundColor: colors.GREY_MED_81,
    color: colors.WHITE,
    borderRadius: 2,
    height: 22,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  deleteLabel: {
    fontSize: 10,
  },
  appInfo: {
    marginLeft: 10,
    flex: 1,
  },
  appName: {
    fontWeight: 'bold',
  },
  appUsers: {
    marginTop: 5,
    fontSize: 12,
    color: colors.GREY_MED_81,
  },
})
