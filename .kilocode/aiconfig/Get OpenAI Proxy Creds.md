**Oscar’s Open AI Proxy:**
* **Endpoint URL:** [https://openai-proxy.air.dev.hioscar.com/v1](https://openai-proxy.air.dev.hioscar.com/v1)

**Obtain OpenAI Proxy Credentials:**  
To connect to our OpenAI Proxy you must obtain a set of temporary (12-24hr) credentials to use as the API Key. You can do this from from your Doscar or Mac Terminal as long as you have access to vault:

```shell
Copy OpenAI Proxy Credentials to Clipboardeval "$(curl -s https://github.hioscar.com/raw/Oscar/sre-toolbox/main/profile-enhancements/vibes_profile)" && gen_ldap_certs && generate_openai_proxy_api_key | pbcopyOutput to Terminal

eval "$(curl -s https://github.hioscar.com/raw/Oscar/sre-toolbox/main/profile-enhancements/vibes_profile)" && gen_ldap_certs && generate_openai_proxy_api_key
```

If you want to do this from Doscar, you need to invoke pbcopy on the mac over SSH. You can do this by setting up an alias in your **\~/.zshrc** file:

```shell
pbcopy () {
    ssh -l {{YOUR MAC USERNAME}} host.docker.internal pbcopy --
}
```