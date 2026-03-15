from awaberryapirequestclient import AwaberryApiRequestClient

def get_credentials():
    import sys
    if len(sys.argv) >= 3:
        return sys.argv[1], sys.argv[2]
    project_key = input("Enter your Project Key: ")
    project_secret = input("Enter your Project Secret: ")
    return project_key, project_secret

def main():
    project_key, project_secret = get_credentials()

    print("use project key " , project_key)

    client = AwaberryApiRequestClient(
        base_url='https://agentic.awaberry.net/apirequests',
        project_key=project_key,
        project_secret=project_secret
    )
    try:
        project_res = client.get_project()
        setup = json.loads(project_res['agentprojectsetup'])
        setup_entries = setup.get('setupEntries', [])

        deviceuuid = None
        if setup_entries and isinstance(setup_entries, list):
            print("Available devices:")
            for entry in setup_entries:
                print(f"{entry['deviceName']}. uuid: {entry['deviceuuid']}")
            if len(setup_entries) == 1:
                deviceuuid = setup_entries[0]['deviceuuid']
                print(f"Using only available device: {deviceuuid}")
        else:
            print("No devices found.")
            return

        client.init_session()
        print("Session initialized successfully.")

        def connect_device(uuid):
            connection_res = client.start_device_connection(uuid)
            print("Device connection started:", connection_res)

            status_res = client.get_device_connection_status(uuid)
            print("Device connection status:", status_res)

            if status_res:
                print("ready to enter commands - type 'exit' to quit")
                while True:
                    command_to_execute = input("type next command: ")
                    if command_to_execute == 'exit':
                        break
                    result = client.execute_command(uuid, command_to_execute)
                    print('endedOnTerminal:', result.get('lastCommandEndedOnTerminal'), " | Result : ", result.get('commandResult'))

        if deviceuuid:
            connect_device(deviceuuid)
        else:
            input_uuid = input("Enter Device UUID to connect: ")
            connect_device(input_uuid)

    except Exception as err:
        print("Error:", err)

if __name__ == "__main__":
    import json
    main()