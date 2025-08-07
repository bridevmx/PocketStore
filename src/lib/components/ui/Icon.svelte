<script>
    /**
     * Props:
     * - name: El nombre completo del icono de Iconify (ej. "lucide:home").
     * - ...rest: Pasa cualquier otra propiedad como `class` al elemento.
     */
    let { name, ...rest } = $props();
</script>

<iconify-icon icon={name} {...rest}></iconify-icon>