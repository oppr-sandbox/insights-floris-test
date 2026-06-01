type Role = {
    value: string;
    color: 'default' | 'secondary' | 'tertiary'
}

export const roles: Array<Role> = [
  {
    value: "ADMIN",
    color: "default",
  },
  {
    value: "MEMBER",
    color: "secondary",
  },
  {
    value: "OWNER",
    color: "tertiary",
  },
]