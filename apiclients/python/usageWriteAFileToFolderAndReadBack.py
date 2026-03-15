from awaberryapirequestclient import AwaberryApiRequestClient
import json
import sys

def get_credentials():
    if len(sys.argv) >= 3:
        return sys.argv[1], sys.argv[2]
    project_key = input("Enter your Project Key: ")
    project_secret = input("Enter your Project Secret: ")
    return project_key, project_secret

def main():
    project_key, project_secret = get_credentials()
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
        if project_res and isinstance(setup_entries, list):
            print('Available devices:')
            for entry in setup_entries:
                print(f"{entry['deviceName']}. uuid: {entry['deviceuuid']}")
            if len(setup_entries) == 1:
                deviceuuid = setup_entries[0]['deviceuuid']
                print(f"Using only available device: {deviceuuid}")
        else:
            print('No devices found.')
            return

        client.init_session()
        print('Session initialized successfully - startDeviceConnection - please wait')

        connection_res = client.start_device_connection(deviceuuid)
        print('Device connection started:', connection_res)

        status_res = client.get_device_connection_status(deviceuuid)
        print('Device connection status:', status_res)

        if status_res:
            print("ready to send commands")

            # 1: write content to file executiontest.txt
            write_file_cmd = 'echo "testcontent\\n\\nthis is test content" > executiontest.txt'
            result_write_file = client.execute_command(deviceuuid, write_file_cmd)
            print("Response write file (empty output expected):", result_write_file.get('commandResult'))

            # 2: read content from executiontest.txt
            read_file_cmd = 'cat executiontest.txt'
            result_read_file = client.execute_command(deviceuuid, read_file_cmd)
            print("resultReadFile:", result_read_file)
            print("Response read file:", result_read_file.get('commandResult'))
    except Exception as err:
        print("Error:", err)

if __name__ == "__main__":
    main()