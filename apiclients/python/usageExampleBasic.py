from awaberryapirequestclient import AwaberryApiRequestClient

def main():
    client = AwaberryApiRequestClient(
        base_url='https://agentic.awaberry.net/apirequests',
        project_key='yourProjectKey',
        project_secret='yourProjectSecret'
    )
    try:
        client.init_session()
        # Use other methods as needed
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()