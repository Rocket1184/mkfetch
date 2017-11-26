# mokee-fetch

Download [Mokee ROM](https://download.mokeedev.com) packages without waitting.

## Usage

```sh
node main.js <command> [argument]
```

Where `<command>` can be one of:

- `dev` / `device`: show all avaliable devices.

- `full` / `full-pkg`: show all full packages for a device. Accept device code as argument.

- `ota` / `ota-pkg`: show all ota pakcages to a specificed version. Accept ota download link as argument.

- `link` / `download`: show real downlink link for a key. Accept key as argument.

- `help`: show help message.
